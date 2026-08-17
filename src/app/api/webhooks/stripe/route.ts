import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { sendOrderConfirmation } from "@/lib/email/send";
import type { OrderConfirmationEmailInput } from "@/lib/email/types";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyStripeWebhook, getStripe } from "@/lib/stripe/server";
import { checkoutSessionCompletedSchema } from "@/lib/stripe/events";
import { getOrderByCheckoutSessionId } from "@/lib/orders/queries";
import { orderLinesInputSchema } from "@/lib/orders/zod";
import type { OrderLineInput } from "@/lib/orders/zod";
import type { RecordOrderResult } from "@/lib/orders/types";

async function updateEmailStatus(
  checkoutSessionId: string,
  status: "sent" | "failed",
): Promise<void> {
  const db = createServiceClient();
  await db
    .from("orders")
    .update({
      email_status: status,
      email_sent_at: status === "sent" ? new Date().toISOString() : null,
    })
    .eq("checkout_session_id", checkoutSessionId);
}

function lineToInput(item: Stripe.LineItem): OrderLineInput {
  const metadata = item.metadata ?? {};
  return {
    product_slug: metadata.product_slug ?? "unknown",
    product_name: metadata.product_name ?? item.description ?? "Artículo",
    size: metadata.size ?? "Única",
    qty: item.quantity ?? 1,
    unit_price_cents: item.price?.unit_amount ?? 0,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let event: Stripe.Event;
  try {
    event = verifyStripeWebhook(rawBody, signature);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  const parsed = checkoutSessionCompletedSchema.safeParse(event);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const sessionId = parsed.data.data.object.id;

  let session: Stripe.Checkout.Session;
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId, {
      expand: ["line_items"],
    });
  } catch {
    return NextResponse.json({ error: "No se pudo recuperar la sesión" }, { status: 500 });
  }

  const lines = orderLinesInputSchema.safeParse(
    (session.line_items?.data ?? []).map(lineToInput),
  );
  if (!lines.success) {
    return NextResponse.json({ error: "Líneas de pedido inválidas" }, { status: 400 });
  }

  const db = createServiceClient();
  const { data: orderResultData, error: rpcError } = await db.rpc(
    "record_checkout_payment",
    {
      p_checkout_session_id: session.id,
      p_customer_email: session.customer_details?.email ?? null,
      p_subtotal_cents: session.amount_subtotal ?? 0,
      p_tax_cents: 0,
      p_shipping_cents: 0,
      p_total_cents: session.amount_total ?? 0,
      p_lines: lines.data,
    },
  );

  if (rpcError) {
    return NextResponse.json({ error: "No se pudo registrar el pedido" }, { status: 500 });
  }

  const orderResult = orderResultData as RecordOrderResult | null;

  // Replays short-circuit here (RPC returns 'exists'); never re-send the email.
  if (orderResult !== "paid") {
    return NextResponse.json({ ok: true });
  }

  // Best-effort email: failure marks email_status and never blocks the 200.
  const order = await getOrderByCheckoutSessionId(sessionId);
  if (order !== null) {
    const customerEmail = order.customerEmail ?? session.customer_details?.email ?? null;
    if (customerEmail === null) {
      await updateEmailStatus(sessionId, "failed");
    } else {
      const emailInput: OrderConfirmationEmailInput = {
        to: customerEmail,
        orderId: order.id,
        checkoutSessionId: order.checkoutSessionId,
        createdAt: order.createdAt,
        items: order.items,
        subtotalCents: order.subtotalCents,
        totalCents: order.totalCents,
      };
      const emailResult = await sendOrderConfirmation(emailInput);
      await updateEmailStatus(sessionId, emailResult.ok ? "sent" : "failed");
    }
  }

  return NextResponse.json({ ok: true });
}