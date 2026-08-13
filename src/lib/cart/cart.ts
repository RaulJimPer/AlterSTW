import { cookies } from "next/headers";
import { CartError } from "./errors";
import { MAX_COOKIE_BYTES, cartCookieSchema } from "./zod";
import type { CartLine } from "./zod";

export const CART_COOKIE = "alterstw_cart";

export async function readCart(): Promise<CartLine[]> {
  const store = await cookies();
  const raw = store.get(CART_COOKIE)?.value;
  if (raw === undefined) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  const result = cartCookieSchema.safeParse(parsed);
  return result.success ? result.data : [];
}

export async function writeCart(lines: CartLine[]): Promise<void> {
  const payload = JSON.stringify(lines);
  if (payload.length > MAX_COOKIE_BYTES) {
    throw new CartError("limit-bytes");
  }
  const store = await cookies();
  store.set(CART_COOKIE, payload, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}

export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}