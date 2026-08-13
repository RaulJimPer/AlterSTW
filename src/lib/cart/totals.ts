import type { CartLineItem, CartState } from "./types";

export function countPurchasable(lines: CartLineItem[]): number {
  return lines.reduce(
    (total, line) => (line.available ? total + line.qty : total),
    0,
  );
}

export function subtotalCents(lines: CartLineItem[]): number {
  return lines.reduce(
    (total, line) =>
      line.available && line.priceCents !== null
        ? total + line.priceCents * line.qty
        : total,
    0,
  );
}

export function isValidCart(lines: CartLineItem[]): boolean {
  return (
    lines.length > 0 &&
    lines.every(
      (line) => line.available && line.qty >= 1 && line.priceCents !== null,
    )
  );
}

export function buildCartState(lines: CartLineItem[]): CartState {
  return {
    lines,
    subtotalCents: subtotalCents(lines),
    count: countPurchasable(lines),
    valid: isValidCart(lines),
  };
}