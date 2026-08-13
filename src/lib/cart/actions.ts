"use server";

import { revalidatePath } from "next/cache";
import { getProductBySlug } from "@/lib/catalog/queries";
import { readCart, writeCart } from "./cart";
import { CartError, CART_ERROR_MESSAGES } from "./errors";
import { resolveCart } from "./queries";
import * as reduce from "./reduce";
import type { CartState } from "./types";
import {
  cartLineKeySchema,
  setQuantityInputSchema,
} from "./zod";
import type { CartLine } from "./zod";

export type CartActionResult =
  | { ok: true; cart: CartState }
  | { ok: false; error: string };

const GENERIC_ERROR = "No se pudo actualizar el carrito. Inténtalo de nuevo.";

async function stockForSize(
  slug: string,
  size: string,
): Promise<{ stock: number } | null> {
  const product = await getProductBySlug(slug);
  if (product === null) return null;
  const option = product.sizes.find((item) => item.size === size);
  return { stock: option?.stock ?? 0 };
}

async function persistAndReturn(
  lines: CartLine[],
): Promise<Extract<CartActionResult, { ok: true }>> {
  await writeCart(lines);
  revalidatePath("/", "layout");
  return { ok: true, cart: await resolveCart(lines) };
}

export async function addToCart(input: {
  slug: string;
  size: string;
}): Promise<CartActionResult> {
  const parsed = cartLineKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: CART_ERROR_MESSAGES["not-found"] };

  const { slug, size } = parsed.data;

  try {
    const sizeInfo = await stockForSize(slug, size);
    if (sizeInfo === null) {
      return { ok: false, error: CART_ERROR_MESSAGES["not-found"] };
    }

    const lines = await readCart();
    const existing = lines.find(
      (line) => line.slug === slug && line.size === size,
    );
    if ((existing?.qty ?? 0) + 1 > sizeInfo.stock) {
      return { ok: false, error: CART_ERROR_MESSAGES["out-of-stock"] };
    }

    const next = reduce.addLine(lines, { slug, size, qty: 1 });
    return persistAndReturn(next);
  } catch (error) {
    if (error instanceof CartError) return { ok: false, error: error.message };
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function setQuantity(input: {
  slug: string;
  size: string;
  qty: number;
}): Promise<CartActionResult> {
  const parsed = setQuantityInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const { slug, size, qty } = parsed.data;

  try {
    const lines = await readCart();
    if (!lines.some((line) => line.slug === slug && line.size === size)) {
      revalidatePath("/", "layout");
      return { ok: true, cart: await resolveCart(lines) };
    }

    const sizeInfo = await stockForSize(slug, size);
    if (sizeInfo === null) {
      return { ok: false, error: CART_ERROR_MESSAGES["not-found"] };
    }

    const bounded = Math.min(qty, sizeInfo.stock);
    const next = reduce.setLineQty(lines, slug, size, bounded);
    return persistAndReturn(next);
  } catch (error) {
    if (error instanceof CartError) return { ok: false, error: error.message };
    return { ok: false, error: GENERIC_ERROR };
  }
}

export async function removeLine(input: {
  slug: string;
  size: string;
}): Promise<CartActionResult> {
  const parsed = cartLineKeySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC_ERROR };

  const { slug, size } = parsed.data;

  try {
    const lines = await readCart();
    const next = reduce.removeLine(lines, slug, size);
    return persistAndReturn(next);
  } catch (error) {
    if (error instanceof CartError) return { ok: false, error: error.message };
    return { ok: false, error: GENERIC_ERROR };
  }
}