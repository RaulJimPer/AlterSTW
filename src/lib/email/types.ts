import type { OrderItemRecord } from "@/lib/orders/types";

// Entrada del template: todo lo que el correo necesita mostrar.
export type OrderConfirmationEmailInput = {
  to: string; // customer_email
  orderId: number;
  checkoutSessionId: string;
  createdAt: string;
  items: OrderItemRecord[];
  subtotalCents: number;
  totalCents: number;
};

export type SendEmailResult = { ok: true } | { ok: false; error: string };