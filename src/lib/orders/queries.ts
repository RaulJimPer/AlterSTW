import { createServiceClient } from "@/lib/supabase/service";
import type { OrderItemRecord, OrderSummary } from "./types";

type OrderItemRow = {
  product_slug: string;
  product_name: string;
  size: string;
  qty: number;
  unit_price_cents: number;
};

type OrderRow = {
  id: number;
  checkout_session_id: string;
  customer_email: string | null;
  status: string;
  email_status: string;
  email_sent_at: string | null;
  subtotal_cents: number;
  total_cents: number;
  created_at: string;
};

type OrderWithItemsResponse = {
  orders: OrderRow[];
  order_items: OrderItemRow[];
};

export async function getOrderByCheckoutSessionId(
  checkoutSessionId: string,
): Promise<OrderSummary | null> {
  const db = createServiceClient();

  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("checkout_session_id", checkoutSessionId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load order: ${error.message}`);
  }
  if (data === null) return null;

  const row = data as unknown as OrderWithItemsResponse["orders"][number] & {
    order_items: OrderItemRow[] | null;
  };

  const items: OrderItemRecord[] = (row.order_items ?? []).map((item) => ({
    productSlug: item.product_slug,
    productName: item.product_name,
    size: item.size,
    qty: item.qty,
    unitPriceCents: item.unit_price_cents,
  }));

  return {
    id: row.id,
    checkoutSessionId: row.checkout_session_id,
    customerEmail: row.customer_email,
    status: row.status as OrderSummary["status"],
    emailStatus: row.email_status as OrderSummary["emailStatus"],
    emailSentAt: row.email_sent_at,
    subtotalCents: row.subtotal_cents,
    totalCents: row.total_cents,
    createdAt: row.created_at,
    items,
  };
}