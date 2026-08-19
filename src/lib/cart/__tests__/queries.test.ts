import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { resolveCart } from "@/lib/cart/queries";
import { EMPTY_CART } from "@/lib/cart/types";
import { FALLBACK_IMAGE } from "@/lib/catalog/queries";
import type { CartLine } from "@/lib/cart/zod";

type Stub = { data: unknown; error: Error | null };
const stubs = new Map<string, Stub>();
const calls: { table: string; ops: string[] }[] = [];

class FakeQuery {
  ops: string[] = [];

  constructor(public table: string) {
    calls.push({ table, ops: this.ops });
  }

  select() {
    return this;
  }
  in(column: string, values: unknown[]) {
    this.ops.push(`in:${column}=[${values.join(",")}]`);
    return this;
  }
  async then(
    onfulfilled: (value: { data: unknown; error: Error | null }) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ) {
    const stub = stubs.get(this.table);
    if (!stub) throw new Error(`no stub for table ${this.table}`);
    try {
      return onfulfilled({ data: stub.data, error: stub.error });
    } catch (reason) {
      if (onrejected) return onrejected(reason);
      throw reason;
    }
  }
}

const db = {
  from(table: string) {
    return new FakeQuery(table);
  },
};

const teeLine: CartLine = { slug: "skull-crush-tee", size: "M", qty: 5 };
const teeRow = {
  id: 1,
  slug: "skull-crush-tee",
  name: "Skull Crush Tee",
  price_cents: 2500,
  images: ["/images/seed/skull-crush.jpg"],
};

function stubCart(productRows: unknown[], sizeRows: unknown[]) {
  stubs.set("catalog_products_v", { data: productRows, error: null });
  stubs.set("product_sizes", { data: sizeRows, error: null });
}

beforeEach(() => {
  stubs.clear();
  calls.length = 0;
});

describe("resolveCart", () => {
  it("returns the empty cart without hitting the database", async () => {
    const state = await resolveCart([]);
    expect(state).toEqual(EMPTY_CART);
    expect(createClient).not.toHaveBeenCalled();
  });

  it("resolves price and stock per size and clamps the quantity", async () => {
    stubCart([teeRow], [{ product_id: 1, size: "M", stock: 3 }]);
    vi.mocked(createClient).mockResolvedValue(db as never);

    const state = await resolveCart([teeLine]);

    expect(state.lines[0]).toMatchObject({
      slug: "skull-crush-tee",
      size: "M",
      qty: 3,
      name: "Skull Crush Tee",
      priceCents: 2500,
      stock: 3,
      available: true,
    });
    expect(state.subtotalCents).toBe(2500 * 3);
    expect(state.count).toBe(3);
    expect(state.valid).toBe(true);
  });

  it("treats a size without stock as unavailable", async () => {
    stubCart([teeRow], [{ product_id: 1, size: "M", stock: 0 }]);
    vi.mocked(createClient).mockResolvedValue(db as never);

    const state = await resolveCart([teeLine]);

    expect(state.lines[0]).toMatchObject({ qty: 0, available: false, stock: 0 });
    expect(state.count).toBe(0);
    expect(state.valid).toBe(false);
  });

  it("marks products outside the catalog as not available", async () => {
    stubCart([], []);
    vi.mocked(createClient).mockResolvedValue(db as never);

    const state = await resolveCart([teeLine]);

    expect(state.lines[0]).toMatchObject({
      name: "Producto no disponible",
      image: FALLBACK_IMAGE,
      priceCents: null,
      available: false,
    });
    expect(state.subtotalCents).toBe(0);
  });

  it("deduplicates slugs before querying products", async () => {
    stubCart([teeRow], [
      { product_id: 1, size: "M", stock: 3 },
      { product_id: 1, size: "L", stock: 1 },
    ]);
    vi.mocked(createClient).mockResolvedValue(db as never);

    await resolveCart([
      { slug: "skull-crush-tee", size: "M", qty: 1 },
      { slug: "skull-crush-tee", size: "L", qty: 1 },
    ]);

    const productQuery = calls.find((call) => call.table === "catalog_products_v");
    expect(productQuery?.ops).toEqual([
      "in:slug=[skull-crush-tee]",
    ]);
  });

  it("degrades to the empty cart when the product query fails", async () => {
    stubs.set("catalog_products_v", { data: null, error: new Error("down") });
    vi.mocked(createClient).mockResolvedValue(db as never);

    expect(await resolveCart([teeLine])).toEqual(EMPTY_CART);
  });

  it("degrades to the empty cart when the sizes query fails", async () => {
    stubs.set("catalog_products_v", { data: [teeRow], error: null });
    stubs.set("product_sizes", { data: null, error: new Error("down") });
    vi.mocked(createClient).mockResolvedValue(db as never);

    expect(await resolveCart([teeLine])).toEqual(EMPTY_CART);
  });
});