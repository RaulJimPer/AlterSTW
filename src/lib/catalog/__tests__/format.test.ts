import { describe, expect, it } from "vitest";
import { formatPrice } from "@/lib/catalog/format";

const NBSP = "\u00A0";

describe("formatPrice", () => {
  it("formats euro amounts in es-ES", () => {
    expect(formatPrice(0)).toBe(`0,00${NBSP}€`);
    expect(formatPrice(2490)).toBe(`24,90${NBSP}€`);
    expect(formatPrice(1)).toBe(`0,01${NBSP}€`);
  });

  it("groups thousands on large amounts", () => {
    expect(formatPrice(1000000)).toBe(`10.000,00${NBSP}€`);
  });
});