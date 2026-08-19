import { z } from "zod";

// Línea tal y como viaja al RPC transaccional record_checkout_payment;
// construida en el webhook a partir de los line_items de la sesión.
export const orderLineInputSchema = z.object({
  product_slug: z.string().trim().min(1),
  product_name: z.string().trim().min(1),
  size: z.string().trim().min(1),
  qty: z.number().int().positive(),
  unit_price_cents: z.number().int().nonnegative(),
});

export const orderLinesInputSchema = z.array(orderLineInputSchema).min(1);

export type OrderLineInput = z.infer<typeof orderLineInputSchema>;

export type RecordCheckoutPaymentParams = {
  p_checkout_session_id: string;
  p_customer_email: string | null;
  p_subtotal_cents: number;
  p_tax_cents: number;
  p_shipping_cents: number;
  p_total_cents: number;
  p_lines: OrderLineInput[];
};