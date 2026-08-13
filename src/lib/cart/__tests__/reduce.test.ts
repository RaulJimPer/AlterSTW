import { describe, expect, it } from "vitest";
import { addLine, removeLine, setLineQty } from "@/lib/cart/reduce";
import { CartError } from "@/lib/cart/errors";
import { MAX_LINES, MAX_QTY } from "@/lib/cart/zod";
import type { CartLine } from "@/lib/cart/zod";

const tee: CartLine = { slug: "skull-crush-tee", size: "M", qty: 1 };

function manyDistinct(count: number): CartLine[] {
  return Array.from({ length: count }, (_, index) => ({
    slug: `producto-${index}`,
    size: "S",
    qty: 1,
  }));
}

describe("addLine", () => {
  it("appends a new line", () => {
    expect(addLine([], tee)).toEqual([tee]);
  });

  it("consolidates the same slug and size into one line", () => {
    const result = addLine([tee], { ...tee, qty: 2 });
    expect(result).toEqual([{ slug: tee.slug, size: tee.size, qty: 3 }]);
    expect(result).toHaveLength(1);
  });

  it("caps a consolidated quantity at MAX_QTY", () => {
    const full = { slug: tee.slug, size: tee.size, qty: MAX_QTY };
    expect(addLine([full], tee)).toEqual([full]);
  });

  it("treats different sizes of the same slug as separate lines", () => {
    const l: CartLine = { slug: tee.slug, size: "L", qty: 1 };
    expect(addLine([tee], l)).toEqual([tee, l]);
  });

  it("throws limit-lines when the cart is already full", () => {
    const full = manyDistinct(MAX_LINES);
    expect(() => addLine(full, tee)).toThrowError(CartError);
    try {
      addLine(full, tee);
    } catch (error) {
      expect((error as CartError).code).toBe("limit-lines");
    }
  });
});

describe("setLineQty", () => {
  it("updates the quantity of an existing line", () => {
    expect(setLineQty([tee], tee.slug, tee.size, 4)).toEqual([
      { ...tee, qty: 4 },
    ]);
  });

  it("removes the line when the quantity drops to zero", () => {
    expect(setLineQty([tee], tee.slug, tee.size, 0)).toEqual([]);
    expect(setLineQty([tee], tee.slug, tee.size, -3)).toEqual([]);
  });

  it("clamps the quantity to the MAX_QTY bound", () => {
    expect(setLineQty([tee], tee.slug, tee.size, 500)).toEqual([
      { ...tee, qty: MAX_QTY },
    ]);
  });

  it("leaves the cart untouched when the line does not exist", () => {
    const result = setLineQty([tee], "otra-tee", "L", 2);
    expect(result).toEqual([tee]);
  });
});

describe("removeLine", () => {
  it("removes the matching line", () => {
    const other: CartLine = { slug: "otra-tee", size: "S", qty: 1 };
    const lines = [tee, other];
    expect(removeLine(lines, tee.slug, tee.size)).toEqual([other]);
  });

  it("does not drop lines that share the slug with a different size", () => {
    const l: CartLine = { slug: tee.slug, size: "L", qty: 1 };
    const lines = [tee, l];
    expect(removeLine(lines, tee.slug, "L")).toEqual([tee]);
  });

  it("returns the same cart when nothing matches", () => {
    expect(removeLine([tee], "no-existe", "XL")).toEqual([tee]);
  });
});