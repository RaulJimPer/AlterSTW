import { describe, expect, it } from "vitest";
import {
  centsToEuros,
  composeCatalogQuery,
  eurosToCents,
} from "@/lib/catalog/search-params";

describe("composeCatalogQuery", () => {
  it("sets patch values and keeps unrelated params", () => {
    const base = new URLSearchParams("av=todos&page=3");
    const query = composeCatalogQuery(base, { cat: "punk" });
    expect(query).toBe("?av=todos&cat=punk");
  });

  it("removes keys patched with empty or undefined values", () => {
    const base = new URLSearchParams("cat=punk&sort=precio-asc");
    const query = composeCatalogQuery(base, { cat: "", sort: undefined });
    expect(query).toBe("");
  });

  it("always resets the page", () => {
    const base = new URLSearchParams("page=9&av=todos");
    const query = composeCatalogQuery(base, { talla: "M" });
    expect(query).toBe("?av=todos&talla=M");
  });
});

describe("eurosToCents / centsToEuros", () => {
  it("rounds euros to integer cents", () => {
    expect(eurosToCents("24.90")).toBe(2490);
    expect(eurosToCents("10")).toBe(1000);
  });

  it("rejects invalid or negative values", () => {
    expect(eurosToCents("abc")).toBeUndefined();
    expect(eurosToCents("-5")).toBeUndefined();
    expect(eurosToCents(undefined)).toBeUndefined();
  });

  it("round-trips cents back to euros", () => {
    expect(centsToEuros("2490")).toBe("24.9");
    expect(centsToEuros("")).toBe("");
  });
});