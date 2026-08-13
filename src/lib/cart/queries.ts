import { FALLBACK_IMAGE } from "@/lib/catalog/queries";
import { createClient } from "@/lib/supabase/server";
import { buildCartState } from "./totals";
import { EMPTY_CART } from "./types";
import type { CartLineItem, CartState } from "./types";
import type { CartLine } from "./zod";

type CartProductRow = {
  id: number | string;
  slug: string;
  name: string;
  price_cents: number;
  images: string[] | null;
};

type CartSizeRow = { product_id: number | string; size: string; stock: number };

export async function resolveCart(lines: CartLine[]): Promise<CartState> {
  if (lines.length === 0) return EMPTY_CART;

  try {
    const db = await createClient();
    const slugs = Array.from(new Set(lines.map((line) => line.slug)));

    const { data: products, error: productError } = await db
      .from("catalog_products_v")
      .select("id, slug, name, price_cents, images")
      .in("slug", slugs);
    if (productError) throw productError;

    const bySlug = new Map(
      ((products as CartProductRow[] | null) ?? []).map((row) => [
        row.slug,
        row,
      ]),
    );
    const ids = Array.from(bySlug.values()).map((row) => row.id);

    const { data: sizeRows, error: sizeError } = await db
      .from("product_sizes")
      .select("product_id, size, stock")
      .in("product_id", ids);
    if (sizeError) throw sizeError;

    const stockByKey = new Map<string, number>();
    for (const row of (sizeRows as CartSizeRow[] | null) ?? []) {
      stockByKey.set(`${row.product_id}:${row.size}`, row.stock);
    }

    const items: CartLineItem[] = lines.map((line) => {
      const product = bySlug.get(line.slug);
      if (product === undefined) {
        return {
          slug: line.slug,
          size: line.size,
          qty: 0,
          name: "Producto no disponible",
          image: FALLBACK_IMAGE,
          priceCents: null,
          stock: 0,
          available: false,
        };
      }
      const stock = stockByKey.get(`${product.id}:${line.size}`) ?? 0;
      return {
        slug: line.slug,
        size: line.size,
        qty: stock > 0 ? Math.min(line.qty, stock) : 0,
        name: product.name,
        image: product.images?.[0] ?? FALLBACK_IMAGE,
        priceCents: product.price_cents,
        stock,
        available: stock > 0,
      };
    });

    return buildCartState(items);
  } catch {
    return EMPTY_CART;
  }
}