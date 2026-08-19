"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guard";
import { createClient } from "@/lib/supabase/server";
import { makeUniqueSlug, slugify } from "./slug";
import { deleteProductImage } from "./storage";
import {
  productFormSchema,
  sizesFormSchema,
  stockUpdateSchema,
} from "./zod";

export type AdminActionResult =
  | { ok: true; slug?: string }
  | { ok: false; error: string };

const GENERIC_ERROR = "No se pudo guardar el cambio. Inténtalo de nuevo.";

export async function createProduct(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const { name, description, priceCents, categoryId, images } = parsed.data;

  const db = await createClient();
  const { data: taken, error: listError } = await db
    .from("products")
    .select("slug");
  if (listError) return { ok: false, error: GENERIC_ERROR };

  const takenSlugs = new Set((taken ?? []).map((row) => row.slug as string));
  const slug = makeUniqueSlug(slugify(name), takenSlugs);

  const { error: insertError } = await db.from("products").insert({
    slug,
    name,
    description,
    price_cents: priceCents,
    category_id: categoryId,
    images,
    status: "draft",
    published_at: null,
  });
  if (insertError) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  return { ok: true, slug };
}

export async function updateProduct(
  slug: string,
  input: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const db = await createClient();
  const { error } = await db
    .from("products")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      price_cents: parsed.data.priceCents,
      category_id: parsed.data.categoryId,
      images: parsed.data.images,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setProductStatus(
  slug: string,
  published: boolean,
): Promise<AdminActionResult> {
  await requireAdmin();

  const db = await createClient();
  const { error } = await db
    .from("products")
    .update({
      status: published ? "published" : "draft",
      published_at: published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveSizes(
  slug: string,
  sizes: unknown,
): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = sizesFormSchema.safeParse(sizes);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const db = await createClient();
  const { data: product, error: productError } = await db
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (productError || product === null) return { ok: false, error: GENERIC_ERROR };

  const productId = product.id as number;

  const { data: existing } = await db
    .from("product_sizes")
    .select("size")
    .eq("product_id", productId);
  const desired = parsed.data.map((size) => size.size);
  const toDelete = (existing ?? [])
    .map((row) => row.size as string)
    .filter((size) => !desired.includes(size));

  if (toDelete.length > 0) {
    const { error: deleteError } = await db
      .from("product_sizes")
      .delete()
      .eq("product_id", productId)
      .in("size", toDelete);
    if (deleteError) return { ok: false, error: GENERIC_ERROR };
  }

  const { error: upsertError } = await db.from("product_sizes").upsert(
    parsed.data.map((size) => ({
      product_id: productId,
      size: size.size,
      stock: size.stock,
      sort_order: size.sortOrder,
    })),
    { onConflict: "product_id,size" },
  );
  if (upsertError) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function setStock(input: unknown): Promise<AdminActionResult> {
  await requireAdmin();
  const parsed = stockUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const db = await createClient();
  const { error } = await db
    .from("product_sizes")
    .update({ stock: parsed.data.stock })
    .eq("product_id", parsed.data.productId)
    .eq("size", parsed.data.size);
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeImage(
  slug: string,
  storagePath: string,
): Promise<AdminActionResult> {
  await requireAdmin();

  const removed = await deleteProductImage(storagePath);
  if (!removed.ok) return { ok: false, error: removed.error };

  const db = await createClient();
  const { data: product, error: productError } = await db
    .from("products")
    .select("images")
    .eq("slug", slug)
    .maybeSingle();
  if (productError || product === null) return { ok: false, error: GENERIC_ERROR };

  const images = ((product.images as string[] | null) ?? []).filter(
    (image) => !image.includes(storagePath),
  );

  const { error } = await db
    .from("products")
    .update({ images, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) return { ok: false, error: GENERIC_ERROR };

  revalidatePath("/admin", "layout");
  return { ok: true };
}