import { describe, expect, it } from "vitest";
import { parseCatalogFilters } from "@/lib/validation/catalog";

describe("parseCatalogFilters", () => {
  it("returns defaults for empty params", () => {
    expect(parseCatalogFilters({})).toEqual({
      av: "todos",
      sort: "nuevos",
      page: 1,
    });
  });

  it("parses all supported filters", () => {
    expect(
      parseCatalogFilters({
        cat: "punk",
        talla: "M",
        min: "1000",
        max: "5000",
        av: "disponible",
        sort: "precio-asc",
        q: "camiseta",
        page: "3",
      }),
    ).toEqual({
      cat: "punk",
      talla: "M",
      min: 1000,
      max: 5000,
      av: "disponible",
      sort: "precio-asc",
      q: "camiseta",
      page: 3,
    });
  });

  it("drops invalid option values and falls back to defaults", () => {
    expect(
      parseCatalogFilters({
        av: "barato",
        sort: "aleatorio",
        page: "0",
      }),
    ).toEqual({
      av: "todos",
      sort: "nuevos",
      page: 1,
    });
  });

  it("drops invalid numeric filters", () => {
    expect(
      parseCatalogFilters({ min: "-5", max: "no-num", page: "abc" }),
    ).toEqual({
      av: "todos",
      sort: "nuevos",
      page: 1,
    });
  });

  it("coerces window strings to integer cents", () => {
    expect(parseCatalogFilters({ min: "1950" }).min).toBe(1950);
  });

  it("rejects non-integer cents", () => {
    expect(parseCatalogFilters({ min: "19.50" }).min).toBeUndefined();
  });

  it("uses the first value when params arrive as arrays", () => {
    expect(
      parseCatalogFilters({ cat: ["punk", "street"], talla: ["M", "L"] }),
    ).toEqual({
      cat: "punk",
      talla: "M",
      av: "todos",
      sort: "nuevos",
      page: 1,
    });
  });
});