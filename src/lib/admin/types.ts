import type { EmailStatus, OrderStatus } from "@/lib/orders/types";

export type ProductStatus = "draft" | "published";

// Fila de la tabla de productos del panel (todos los estados).
export type AdminProductListRow = {
  id: string;
  slug: string;
  name: string;
  categoryName: string;
  priceCents: number;
  status: ProductStatus;
  publishedAt: string | null;
  updatedAt: string;
  stockTotal: number;
};

// Detalle de edición: producto + tallas.
export type AdminProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceCents: number;
  categoryId: string;
  images: string[];
  status: ProductStatus;
  publishedAt: string | null;
  sizes: { size: string; stock: number; sortOrder: number }[];
};

// Fila del inventario (una por talla de un producto).
export type InventoryRow = {
  productId: string;
  productSlug: string;
  productName: string;
  categoryName: string;
  size: string;
  stock: number;
  sortOrder: number;
};

// Listado de pedidos del panel (reusa el tracking de 003).
export type AdminOrderListItem = {
  id: string;
  checkoutSessionId: string;
  customerEmail: string | null;
  status: OrderStatus;
  emailStatus: EmailStatus;
  totalCents: number;
  createdAt: string;
};

export type AdminProductsPage = { items: AdminProductListRow[]; total: number };
export type AdminOrdersPage = { items: AdminOrderListItem[]; total: number };