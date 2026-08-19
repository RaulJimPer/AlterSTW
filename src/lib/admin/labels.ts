import type { EmailStatus, OrderStatus } from "@/lib/orders/types";
import type { ProductStatus } from "@/lib/admin/types";

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Pagado",
  stock_failed: "Sin stock",
};

export const EMAIL_STATUS_LABELS: Record<EmailStatus, string> = {
  pending: "Pendiente",
  sent: "Enviado",
  failed: "Falló",
};

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}