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

export const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "5XL",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "Talla única",
] as const;

export const SIZE_OTHER = "Otra talla…";

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}