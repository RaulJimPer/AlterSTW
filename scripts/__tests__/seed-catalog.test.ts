import { describe, expect, it } from "vitest";
import {
  assertAllSeedAssets,
  seedCategories,
  seedCatalog,
  stockTotalOf,
} from "../seed";

const categorySlugs = [
  "camisetas",
  "sudaderas",
  "pantalones",
  "chaquetas",
  "accesorios",
];

describe("seed catalog integrity", () => {
  it("declares the five categories in canonical order", () => {
    expect(seedCategories.map((category) => category.slug)).toEqual(categorySlugs);
  });

  it("has products with unique slugs and valid keys", () => {
    const slugs = seedCatalog.map((product) => product.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const product of seedCatalog) {
      expect(product.slug).toMatch(/^[a-z0-9-]+$/);
      expect(product.priceCents).toBeGreaterThan(0);
    }
  });

  it("only uses declared categories and has no duplicate sizes per product", () => {
    for (const product of seedCatalog) {
      expect(categorySlugs).toContain(product.category);
      const sizes = product.sizes.map((entry) => entry.size);
      expect(new Set(sizes).size).toBe(sizes.length);
    }
  });

  it("references existing images for every product", () => {
    expect(() => assertAllSeedAssets()).not.toThrow();
    for (const product of seedCatalog) {
      expect(product.image).toMatch(/^\/images\/seed\/.+\.(jpg|jpeg|png)$/);
    }
  });

  it("covers every availability badge state on purpose", () => {
    let nuevo = 0;
    let ultimas = 0;
    let agotado = 0;
    let neutral = 0;

    for (const product of seedCatalog) {
      const stock = stockTotalOf(product);
      if (stock === 0) {
        agotado += 1;
      } else if (product.publishedDaysAgo < 14) {
        nuevo += 1;
      } else if (stock <= 3) {
        ultimas += 1;
      } else {
        neutral += 1;
      }
    }

    expect(agotado).toBeGreaterThanOrEqual(1);
    expect(nuevo).toBeGreaterThanOrEqual(1);
    expect(ultimas).toBeGreaterThanOrEqual(1);
    expect(neutral).toBeGreaterThanOrEqual(1);
  });

  it("keeps the Spanish copy free of encoding artifacts", () => {
    for (const product of seedCatalog) {
      expect(product.description).not.toMatch(/Ã/);
      expect(product.name).not.toMatch(/Ã/);
    }
    for (const product of seedCatalog) {
      for (const entry of product.sizes) {
        expect(entry.size).not.toMatch(/Ã/);
      }
    }
  });
});