import { describe, expect, it } from "vitest";
import {
  buildCartState,
  countPurchasable,
  isValidCart,
  subtotalCents,
} from "@/lib/cart/totals";
import type { CartLineItem } from "@/lib/cart/types";

const available: CartLineItem = {
  slug: "skull-crush-tee",
  size: "M",
  qty: 2,
  name: "Skull Crush Tee",
  image: "/images/seed/skull-crush.jpg",
  priceCents: 2500,
  stock: 5,
  available: true,
};

describe("countPurchasable", () => {
  it("only counts lines that are available", () => {
    const soldOut: CartLineItem = { ...available, qty: 3, available: false };
    expect(countPurchasable([available, soldOut])).toBe(2);
  });

  it("returns zero for an empty cart", () => {
    expect(countPurchasable([])).toBe(0);
  });
});

describe("subtotalCents", () => {
  it("sums unit price times quantity in exact cents", () => {
    const three = { ...available, qty: 3 };
    expect(subtotalCents([available, three])).toBe(2500 * 2 + 2500 * 3);
  });

  it("skips unavailable lines", () => {
    const soldOut: CartLineItem = { ...available, qty: 2, available: false };
    expect(subtotalCents([soldOut])).toBe(0);
  });

  it("skips lines whose price is unknown", () => {
    const orphan: CartLineItem = { ...available, priceCents: null };
    expect(subtotalCents([orphan])).toBe(0);
  });

  it("returns zero for an empty cart", () => {
    expect(subtotalCents([])).toBe(0);
  });
});

describe("isValidCart", () => {
  it("is false for an empty cart", () => {
    expect(isValidCart([])).toBe(false);
  });

  it("is true when every line is available with a price", () => {
    expect(isValidCart([available])).toBe(true);
  });

  it("is false when a line is not available", () => {
    const soldOut: CartLineItem = { ...available, available: false, qty: 0 };
    expect(isValidCart([available, soldOut])).toBe(false);
  });

  it("is false when a price is unknown", () => {
    const orphan: CartLineItem = { ...available, priceCents: null };
    expect(isValidCart([orphan])).toBe(false);
  });

  it("is false when a line has no units", () => {
    const empty: CartLineItem = { ...available, qty: 0 };
    expect(isValidCart([empty])).toBe(false);
  });
});

describe("buildCartState", () => {
  it("derives subtotal, count and validity from the lines", () => {
    const soldOut: CartLineItem = {
      ...available,
      qty: 4,
      available: false,
      priceCents: null,
    };
    const state = buildCartState([available, soldOut]);

    expect(state.lines).toEqual([available, soldOut]);
    expect(state.subtotalCents).toBe(5000);
    expect(state.count).toBe(2);
    expect(state.valid).toBe(false);
  });
});