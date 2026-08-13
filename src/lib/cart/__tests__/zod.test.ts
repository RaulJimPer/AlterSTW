import { describe, expect, it } from "vitest";
import {
  MAX_COOKIE_BYTES,
  MAX_LINES,
  MAX_QTY,
  cartCookieSchema,
  cartLineKeySchema,
  cartLineSchema,
  setQuantityInputSchema,
} from "@/lib/cart/zod";

describe("cartLineSchema", () => {
  const valid = { slug: "skull-crush-tee", size: "M", qty: 2 };

  it("accepts a well-formed line", () => {
    expect(cartLineSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty slug", () => {
    expect(cartLineSchema.safeParse({ ...valid, slug: "  " }).success).toBe(false);
  });

  it("rejects an empty size", () => {
    expect(cartLineSchema.safeParse({ ...valid, size: "" }).success).toBe(false);
  });

  it("rejects a quantity outside the 1..MAX_QTY bounds", () => {
    expect(cartLineSchema.safeParse({ ...valid, qty: 0 }).success).toBe(false);
    expect(
      cartLineSchema.safeParse({ ...valid, qty: MAX_QTY + 1 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer quantity", () => {
    expect(cartLineSchema.safeParse({ ...valid, qty: 1.5 }).success).toBe(false);
  });
});

describe("cartCookieSchema", () => {
  it("accepts a list of lines", () => {
    const lines = [{ slug: "tee", size: "S", qty: 1 }];
    expect(cartCookieSchema.safeParse(lines).success).toBe(true);
  });

  it("rejects more than MAX_LINES distinct lines", () => {
    const lines = Array.from({ length: MAX_LINES + 1 }, (_, index) => ({
      slug: `tee-${index}`,
      size: "S",
      qty: 1,
    }));
    expect(cartCookieSchema.safeParse(lines).success).toBe(false);
  });
});

describe("cartLineKeySchema", () => {
  it("accepts a slug and size pair", () => {
    expect(
      cartLineKeySchema.safeParse({ slug: "tee", size: "M" }).success,
    ).toBe(true);
  });

  it("rejects input without a size", () => {
    expect(cartLineKeySchema.safeParse({ slug: "tee" }).success).toBe(false);
  });
});

describe("setQuantityInputSchema", () => {
  it("accepts a bound quantity including zero", () => {
    expect(
      setQuantityInputSchema.safeParse({ slug: "tee", size: "M", qty: 0 })
        .success,
    ).toBe(true);
    expect(
      setQuantityInputSchema.safeParse({ slug: "tee", size: "M", qty: 7 })
        .success,
    ).toBe(true);
  });

  it("rejects a negative or oversized quantity", () => {
    expect(
      setQuantityInputSchema.safeParse({ slug: "tee", size: "M", qty: -1 })
        .success,
    ).toBe(false);
    expect(
      setQuantityInputSchema.safeParse({ slug: "tee", size: "M", qty: MAX_QTY + 1 })
        .success,
    ).toBe(false);
  });

  it("coerces string numbers from form payloads", () => {
    const result = setQuantityInputSchema.safeParse({
      slug: "tee",
      size: "M",
      qty: "3",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.qty).toBe(3);
  });
});

describe("limits", () => {
  it("exposes the documented constants", () => {
    expect(MAX_LINES).toBe(20);
    expect(MAX_QTY).toBe(99);
    expect(MAX_COOKIE_BYTES).toBe(3000);
  });
});