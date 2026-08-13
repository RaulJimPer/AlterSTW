import type { CartLine } from "./zod";

export type CartLineItem = CartLine & {
  name: string;
  image: string;
  priceCents: number | null;
  stock: number;
  available: boolean;
};

export type CartState = {
  lines: CartLineItem[];
  subtotalCents: number;
  count: number;
  valid: boolean;
};

export const EMPTY_CART: CartState = {
  lines: [],
  subtotalCents: 0,
  count: 0,
  valid: false,
};