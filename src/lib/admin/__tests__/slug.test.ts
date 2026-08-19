import { describe, expect, it } from "vitest";
import { makeUniqueSlug, slugify } from "@/lib/admin/slug";

describe("slugify", () => {
  it("turns a name into a kebab-case slug", () => {
    expect(slugify("Skull Crush Tee")).toBe("skull-crush-tee");
  });

  it("strips Spanish accents", () => {
    expect(slugify("Águila Camiseta Única")).toBe("aguila-camiseta-unica");
  });

  it("lowercases and collapses runs of separators", () => {
    expect(slugify("  Camiseta   —  Negra  ")).toBe("camiseta-negra");
  });

  it("truncates long names to 80 characters without a trailing dash", () => {
    const long = "x".repeat(100);
    const slug = slugify(long);
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("falls back to 'producto' when nothing survives", () => {
    expect(slugify("!!!")).toBe("producto");
  });
});

describe("makeUniqueSlug", () => {
  it("returns the base slug when it is free", () => {
    expect(makeUniqueSlug("camiseta", new Set(["otra"]))).toBe("camiseta");
  });

  it("appends a numeric suffix when the base is taken", () => {
    expect(makeUniqueSlug("camiseta", new Set(["camiseta"]))).toBe(
      "camiseta-2",
    );
  });

  it("skips taken suffixes", () => {
    expect(
      makeUniqueSlug("camiseta", new Set(["camiseta", "camiseta-2"])),
    ).toBe("camiseta-3");
  });
});