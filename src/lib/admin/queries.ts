import { createClient } from "@/lib/supabase/server";
import type {
  AdminOrderListItem,
  AdminOrdersPage,
  AdminProductDetail,
  AdminProductListRow,
  AdminProductsPage,
  InventoryRow,
} from "./types";
import type { AdminOrderFilters, AdminProductFilters } from "./zod";
import { ADMIN_PAGE_SIZE } from "./zod";
import type { OrderItemRecord, OrderSummary } from "@/lib/orders/types";

type CategoryEmbed = { name: string } | null;
type SizeEmbed = { stock: number } | null;
type SizeDetail = { size: string; stock: number; sort_order: number };
type SizeDetailEmbed = SizeDetail | null;

type ProductListRow = {
  id: number | string;
  slug: string;
  name: string;
  price_cents: number;
  status: string;
  published_at: string | null;
  updated_at: string;
  categories: CategoryEmbed;
  product_sizes: SizeEmbed[] | null;
};

type ProductDetailRow = {
  id: number | string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: number | string;
  images: string[] | null;
  status: string;
  published_at: string | null;
  product_sizes: SizeDetailEmbed[] | null;
};

type OrderRow = {
  id: number | string;
  checkout_session_id: string;
  customer_email: string | null;
  status: string;
  email_status: string;
  total_cents: number;
  created_at: string;
};

type OrderDetailRow = OrderRow & {
  subtotal_cents: number;
  email_sent_at: string | null;
  order_items: OrderItemRow[] | null;
};

type OrderItemRow = {
  product_slug: string;
  product_name: string;
  size: string;
  qty: number;
  unit_price_cents: number;
};

type InventoryProductRow = {
  id: number | string;
  slug: string;
  name: string;
  categories: CategoryEmbed;
  product_sizes: SizeDetailEmbed[] | null;
};

export async function getAdminProducts(
  filters: AdminProductFilters,
): Promise<AdminProductsPage> {
  const db = await createClient();
  let query = db
    .from("products")
    .select(
      "id, slug, name, price_cents, status, published_at, updated_at, categories(name), product_sizes(stock)",
      { count: "exact" },
    );

  if (filters.status !== undefined) {
    query = query.eq("status", filters.status);
  }
  if (filters.categoryId !== undefined) {
    query = query.eq("category_id", filters.categoryId);
  }
  if (filters.q !== undefined) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  query = query.order("updated_at", { ascending: false });

  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE;
  query = query.range(offset, offset + ADMIN_PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to load admin products: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as ProductListRow[];
  return {
    items: rows.map((row) => ({
      id: String(row.id),
      slug: row.slug,
      name: row.name,
      categoryName: row.categories?.name ?? "—",
      priceCents: row.price_cents,
      status: row.status as AdminProductListRow["status"],
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      stockTotal: (row.product_sizes ?? []).reduce(
        (sum, size) => sum + (size?.stock ?? 0),
        0,
      ),
    })),
    total: count ?? 0,
  };
}

export async function getAdminProductBySlug(
  slug: string,
): Promise<AdminProductDetail | null> {
  const db = await createClient();
  const { data, error } = await db
    .from("products")
    .select(
      "id, slug, name, description, price_cents, category_id, images, status, published_at, product_sizes(size, stock, sort_order)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin product: ${error.message}`);
  }
  if (data === null) return null;

  const row = data as unknown as ProductDetailRow;
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents,
    categoryId: String(row.category_id),
    images: row.images ?? [],
    status: row.status as AdminProductDetail["status"],
    publishedAt: row.published_at,
    sizes: (row.product_sizes ?? [])
      .filter((size): size is SizeDetail => size !== null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((size) => ({
        size: size.size,
        stock: size.stock,
        sortOrder: size.sort_order,
      })),
  };
}

export async function getAdminOrders(
  filters: AdminOrderFilters,
): Promise<AdminOrdersPage> {
  const db = await createClient();
  let query = db
    .from("orders")
    .select(
      "id, checkout_session_id, customer_email, status, email_status, total_cents, created_at",
      { count: "exact" },
    );

  if (filters.status !== undefined) {
    query = query.eq("status", filters.status);
  }
  if (filters.emailStatus !== undefined) {
    query = query.eq("email_status", filters.emailStatus);
  }

  query = query.order("created_at", { ascending: false });

  const offset = (filters.page - 1) * ADMIN_PAGE_SIZE;
  query = query.range(offset, offset + ADMIN_PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to load admin orders: ${error.message}`);
  }

  const rows = (data ?? []) as OrderRow[];
  return {
    items: rows.map((row) => ({
      id: String(row.id),
      checkoutSessionId: row.checkout_session_id,
      customerEmail: row.customer_email,
      status: row.status as AdminOrderListItem["status"],
      emailStatus: row.email_status as AdminOrderListItem["emailStatus"],
      totalCents: row.total_cents,
      createdAt: row.created_at,
    })),
    total: count ?? 0,
  };
}

export async function getAdminOrderById(
  id: number | string,
): Promise<OrderSummary | null> {
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return null;

  const db = await createClient();
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", numericId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load admin order: ${error.message}`);
  }
  if (data === null) return null;

  const row = data as unknown as OrderDetailRow;
  const items: OrderItemRecord[] = (row.order_items ?? []).map((item) => ({
    productSlug: item.product_slug,
    productName: item.product_name,
    size: item.size,
    qty: item.qty,
    unitPriceCents: item.unit_price_cents,
  }));

  return {
    id: Number(row.id),
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

export async function getInventoryRows(): Promise<InventoryRow[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("products")
    .select(
      "id, slug, name, categories(name), product_sizes(size, stock, sort_order)",
    )
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load inventory: ${error.message}`);
  }

  const rows = (data ?? []) as unknown as InventoryProductRow[];

  return rows.flatMap((row) =>
    (row.product_sizes ?? [])
      .filter((size): size is SizeDetail => size !== null)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((size) => ({
        productId: String(row.id),
        productSlug: row.slug,
        productName: row.name,
        categoryName: row.categories?.name ?? "—",
        size: size.size,
        stock: size.stock,
        sortOrder: size.sort_order,
      })),
  );
}