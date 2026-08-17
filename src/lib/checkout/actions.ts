"use server";

import { revalidatePath } from "next/cache";
import { clearCartCookie, readCart } from "@/lib/cart/cart";
import { resolveCart } from "@/lib/cart/queries";
import type { CheckoutResult } from "@/lib/orders/types";
import { getStripe } from "@/lib/stripe/server";

const GENERIC_ERROR = "No se pudo iniciar el pago. Inténtalo de nuevo.";

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export async function createCheckoutSession(): Promise<CheckoutResult> {
  try {
    const cart = await resolveCart(await readCart());

    // Hard stock gate: the CTA is only wired when cart.valid, but the action
    // re-checks the server-validated state before opening a session.
    const sellableLines = cart.lines.filter(
      (line) => line.available && line.priceCents !== null,
    );
    if (sellableLines.length === 0) {
      return { ok: false, error: "Tu carro necesita artículos disponibles para continuar." };
    }
    if (!cart.valid || sellableLines.length !== cart.lines.length) {
      return { ok: false, error: "Algún artículo de tu carro ya no está disponible." };
    }

    const lineItems = sellableLines.map((line) => ({
      price_data: {
        currency: "eur",
        unit_amount: line.priceCents as number,
        product_data: {
          name: `${line.name} (Talla ${line.size})`,
          metadata: { product_slug: line.slug },
        },
      },
      // Item-level metadata is the valid channel (Stripe rejects metadata
      // inside price_data); the webhook reads it from the expanded session.
      metadata: {
        product_slug: line.slug,
        size: line.size,
        product_name: line.name,
      },
      quantity: line.qty,
    }));

    const siteUrl = getSiteUrl();
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
      locale: "es",
    });

    if (!session.url) {
      return { ok: false, error: GENERIC_ERROR };
    }
    return { ok: true, url: session.url };
  } catch {
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function clearCartAfterOrder(): Promise<void> {
  await clearCartCookie();
  revalidatePath("/", "layout");
}