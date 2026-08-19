import { createClient } from "@/lib/supabase/server";
import { computeBadge } from "@/lib/catalog/availability";
import type {
  Category,
  CatalogPage,
  ProductDetail,
  ProductSummary,
} from "@/lib/catalog/types";
import { PAGE_SIZE, type CatalogFilters } from "@/lib/validation/catalog";

export const FALLBACK_IMAGE = "/images/seed/fallback.svg";
const CANONICAL_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL", "Única"];

type CatalogProductRow = {
  id: number | string;
  slug: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: number | string;
  category_slug: string;
  category_name: string;
  images: string[] | null;
  published_at: string | null;
  published_sort: string | null;
  stock_total: number;
  available_sizes: string[] | null;
};

function toProductSummary(row: CatalogProductRow): ProductSummary {
  const images = row.images ?? [];
  return {
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    priceCents: row.price_cents,
    image: images.length > 0 ? images[0] : FALLBACK_IMAGE,
    categorySlug: row.category_slug,
    categoryName: row.category_name,
    stockTotal: row.stock_total,
    badge: computeBadge(row.stock_total, row.published_at),
    publishedAt: row.published_at ?? "",
  };
}

export async function getCategories(): Promise<Category[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("categories")
    .select("id, slug, name, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    throw new Error(`Failed to load categories: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function getAvailableSizes(): Promise<string[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("catalog_products_v")
    .select("available_sizes");

  if (error) {
    throw new Error(`Failed to load sizes: ${error.message}`);
  }

  const sizes = new Set<string>();
  for (const row of (data ?? []) as { available_sizes: string[] | null }[]) {
    for (const size of row.available_sizes ?? []) sizes.add(size);
  }

  const rank = new Map(
    CANONICAL_SIZE_ORDER.map((size, index) => [size, index]),
  );
  return Array.from(sizes).sort(
    (a, b) => (rank.get(a) ?? 99) - (rank.get(b) ?? 99),
  );
}

export async function getPublishedProducts(
  filters: CatalogFilters,
): Promise<CatalogPage> {
  const db = await createClient();
  let query = db.from("catalog_products_v").select("*", { count: "exact" });

  if (filters.cat !== undefined) {
    query = query.eq("category_slug", filters.cat);
  }
  if (filters.talla !== undefined) {
    query = query.contains("available_sizes", [filters.talla]);
  }
  if (filters.min !== undefined) {
    query = query.gte("price_cents", filters.min);
  }
  if (filters.max !== undefined) {
    query = query.lte("price_cents", filters.max);
  }
  if (filters.av === "disponible") {
    query = query.gt("stock_total", 0);
  } else if (filters.av === "ultimas") {
    query = query.gte("stock_total", 1);
    query = query.lte("stock_total", 3);
  }
  if (filters.q !== undefined) {
    query = query.ilike("name", `%${filters.q}%`);
  }

  if (filters.sort === "precio-asc") {
    query = query.order("price_cents", { ascending: true });
  } else if (filters.sort === "precio-desc") {
    query = query.order("price_cents", { ascending: false });
  } else {
    query = query.order("published_sort", { ascending: false });
  }

  const offset = (filters.page - 1) * PAGE_SIZE;
  query = query.range(offset, offset + PAGE_SIZE - 1);

  const { data, error, count } = await query;
  if (error) {
    throw new Error(`Failed to load products: ${error.message}`);
  }

  const rows = (data ?? []) as CatalogProductRow[];
  const total = count ?? 0;
  return {
    items: rows.map(toProductSummary),
    page: filters.page,
    pageSize: PAGE_SIZE,
    total,
    hasMore: offset + rows.length < total,
  };
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductDetail | null> {
  const db = await createClient();
  const { data, error } = await db
    .from("catalog_products_v")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load product: ${error.message}`);
  }
  if (data === null) return null;

  const row = data as CatalogProductRow;
  const { data: sizeRows, error: sizeError } = await db
    .from("product_sizes")
    .select("size, stock, sort_order")
    .eq("product_id", row.id)
    .order("sort_order", { ascending: true });

  if (sizeError) {
    throw new Error(`Failed to load sizes: ${sizeError.message}`);
  }

  return {
    ...toProductSummary(row),
    description: row.description,
    images: row.images ?? [],
    sizes: (sizeRows ?? []).map((sizeRow) => ({
      size: sizeRow.size,
      stock: sizeRow.stock,
      available: sizeRow.stock > 0,
    })),
  };
}
