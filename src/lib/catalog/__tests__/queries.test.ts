import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import {
  getAvailableSizes,
  getCategories,
  getProductBySlug,
  getPublishedProducts,
} from "@/lib/catalog/queries";
import type { CatalogFilters } from "@/lib/validation/catalog";

type Stub =
  | { data: unknown; count: number | null; error: Error | null }
  | undefined;

const stubs = new Map<string, Stub>();
const calls: FakeQuery[] = [];

class FakeQuery {
  ops: string[] = [];
  single = false;

  constructor(public table: string) {}

  select() {
    return this;
  }
  eq(column: string, value: unknown) {
    this.ops.push(`eq:${column}=${String(value)}`);
    return this;
  }
  contains(column: string, value: unknown[]) {
    this.ops.push(`contains:${column}=[${value.join(",")}]`);
    return this;
  }
  gte(column: string, value: unknown) {
    this.ops.push(`gte:${column}=${String(value)}`);
    return this;
  }
  lte(column: string, value: unknown) {
    this.ops.push(`lte:${column}=${String(value)}`);
    return this;
  }
  gt(column: string, value: unknown) {
    this.ops.push(`gt:${column}=${String(value)}`);
    return this;
  }
  ilike(column: string, value: unknown) {
    this.ops.push(`ilike:${column}=${String(value)}`);
    return this;
  }
  order(column: string) {
    this.ops.push(`order:${column}`);
    return this;
  }
  range(from: number, to: number) {
    this.ops.push(`range:${from}-${to}`);
    return this;
  }
  maybeSingle() {
    this.single = true;
    return this;
  }
  async then(
    onfulfilled: (value: unknown) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) {
    const stub = stubs.get(this.table);
    if (!stub) throw new Error(`no stub for table ${this.table}`);
    let data = stub.data ?? [];
    if (this.single) {
      data = Array.isArray(data) ? (data[0] ?? null) : null;
    }
    try {
      return onfulfilled({
        data,
        error: stub.error ?? null,
        count: stub.count,
      });
    } catch (reason) {
      if (onrejected) return onrejected(reason);
      throw reason;
    }
  }
}

const db = {
  from(table: string) {
    const query = new FakeQuery(table);
    calls.push(query);
    return query;
  },
};

beforeEach(() => {
  stubs.clear();
  calls.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

const productRow = {
  id: 1,
  slug: "camiseta-punk",
  name: "Camiseta punk",
  description: "Algodón grueso, serigrafía a una tinta.",
  price_cents: 2490,
  category_id: 1,
  category_slug: "punk",
  category_name: "Punk",
  images: ["/images/seed/camiseta-punk-1.svg"],
  published_at: "2026-01-02T12:00:00Z",
  published_sort: "2026-01-02T12:00:00Z",
  stock_total: 12,
  available_sizes: ["S", "M"],
};

describe("getCategories", () => {
  it("maps and orders category rows", async () => {
    stubs.set("categories", {
      data: [
        { id: 1, slug: "punk", name: "Punk", sort_order: 0 },
        { id: 2, slug: "street", name: "Street", sort_order: 1 },
      ],
      count: null,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const categories = await getCategories();

    expect(categories).toEqual([
      { id: "1", slug: "punk", name: "Punk", sortOrder: 0 },
      { id: "2", slug: "street", name: "Street", sortOrder: 1 },
    ]);
    expect(calls[0].ops).toEqual(["order:sort_order"]);
  });

  it("throws when the query fails", async () => {
    stubs.set("categories", {
      data: null,
      count: null,
      error: new Error("connection reset"),
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    await expect(getCategories()).rejects.toThrow(/Failed to load categories/);
  });
});

describe("getPublishedProducts", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  const defaultFilters: CatalogFilters = {
    av: "todos",
    sort: "nuevos",
    page: 1,
  };

  it("applies the default sort, pagination and maps summaries", async () => {
    stubs.set("catalog_products_v", {
      data: [productRow],
      count: 1,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const result = await getPublishedProducts(defaultFilters);

    expect(result.total).toBe(1);
    expect(result.hasMore).toBe(false);
    expect(result.items[0]).toMatchObject({
      id: "1",
      slug: "camiseta-punk",
      name: "Camiseta punk",
      priceCents: 2490,
      image: "/images/seed/camiseta-punk-1.svg",
      categorySlug: "punk",
      categoryName: "Punk",
      stockTotal: 12,
    });
    expect(calls[0].ops).toEqual(["order:published_sort", "range:0-23"]);
  });

  it("flags hasMore when the page overflows", async () => {
    stubs.set("catalog_products_v", {
      data: [productRow],
      count: 30,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const result = await getPublishedProducts(defaultFilters);
    expect(result.hasMore).toBe(true);
    expect(calls[0].ops).toContain("range:0-23");
  });

  it("computes a badge from stock and publication date", async () => {
    const oldRow = { ...productRow, published_at: "2020-01-01T00:00:00Z" };
    stubs.set("catalog_products_v", { data: [oldRow], count: 1, error: null });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const { items } = await getPublishedProducts(defaultFilters);
    expect(items[0].badge).toBeNull();
  });

  it("translates filters into the expected operators", async () => {
    stubs.set("catalog_products_v", { data: [], count: 0, error: null });
    vi.mocked(createClient).mockResolvedValue(db as never);

    await getPublishedProducts({
      cat: "punk",
      talla: "M",
      min: 1000,
      max: 5000,
      av: "ultimas",
      sort: "precio-asc",
      q: "camiseta",
      page: 2,
    });

    const ops = calls[0].ops;
    expect(ops).toContain("eq:category_slug=punk");
    expect(ops).toContain("contains:available_sizes=[M]");
    expect(ops).toContain("gte:price_cents=1000");
    expect(ops).toContain("lte:price_cents=5000");
    expect(ops).toContain("gte:stock_total=1");
    expect(ops).toContain("lte:stock_total=3");
    expect(ops).toContain("ilike:name=%camiseta%");
    expect(ops).toContain("order:price_cents");
    expect(ops).toContain("range:24-47");
  });

  it("throws when the query fails", async () => {
    stubs.set("catalog_products_v", {
      data: null,
      count: null,
      error: new Error("bad request"),
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    await expect(getPublishedProducts(defaultFilters)).rejects.toThrow(
      /Failed to load products/,
    );
  });
});

describe("getProductBySlug", () => {
  it("returns null for an unknown slug", async () => {
    stubs.set("catalog_products_v", { data: [], count: null, error: null });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const product = await getProductBySlug("no-existe");
    expect(product).toBeNull();
    expect(calls[0].ops).toEqual([
      "eq:slug=no-existe",
    ]);
  });

  it("returns a detail with per-size stock", async () => {
    stubs.set("catalog_products_v", {
      data: [productRow],
      count: null,
      error: null,
    });
    stubs.set("product_sizes", {
      data: [
        { product_id: 1, size: "S", stock: 3, sort_order: 1 },
        { product_id: 1, size: "M", stock: 0, sort_order: 2 },
      ],
      count: null,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const product = await getProductBySlug("camiseta-punk");

    expect(product?.description).toContain("serigrafía");
    expect(product?.sizes).toEqual([
      { size: "S", stock: 3, available: true },
      { size: "M", stock: 0, available: false },
    ]);
    expect(calls[1].ops).toEqual(["eq:product_id=1", "order:sort_order"]);
  });
});

describe("getAvailableSizes", () => {
  it("returns unique sizes in canonical order", async () => {
    stubs.set("catalog_products_v", {
      data: [
        { available_sizes: ["M", "S"] },
        { available_sizes: ["XL", "M"] },
        { available_sizes: null },
      ],
      count: null,
      error: null,
    });
    vi.mocked(createClient).mockResolvedValue(db as never);

    const sizes = await getAvailableSizes();
    expect(sizes).toEqual(["S", "M", "XL"]);
  });
});