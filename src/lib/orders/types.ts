export type OrderStatus = "paid" | "stock_failed";
export type EmailStatus = "pending" | "sent" | "failed";

// Una línea del pedido, precio = lo cobrado por Stripe.
export type OrderItemRecord = {
  productSlug: string;
  productName: string;
  size: string;
  qty: number;
  unitPriceCents: number;
};

export type OrderSummary = {
  id: number;
  checkoutSessionId: string;
  customerEmail: string | null;
  status: OrderStatus;
  emailStatus: EmailStatus;
  emailSentAt: string | null;
  subtotalCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderItemRecord[];
};

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

// Resultado del único RPC transaccional que materializa una orden.
export type RecordOrderResult = "paid" | "stock_failed" | "exists";