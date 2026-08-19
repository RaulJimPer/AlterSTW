import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  createClientMock,
  deleteProductImageMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  createClientMock: vi.fn(),
  deleteProductImageMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/auth/guard", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/lib/admin/storage", () => ({
  deleteProductImage: deleteProductImageMock,
}));

import {
  createProduct,
  removeImage,
  saveSizes,
  setProductStatus,
  setStock,
  updateProduct,
} from "@/lib/admin/actions";

type Response = { data?: unknown; error?: unknown; count?: number | null };

// Stub de Supabase: `chain` es thenable (await resuelve la siguiente respuesta
// de la cola) y registra cada llamada para poder asertar sobre ellas.
function stubDb(responses: Response[]) {
  let cursor = 0;
  const next = (): Response =>
    responses[cursor++] ?? { data: undefined, error: null };

  const fromCalls: string[] = [];
  const selectCalls: string[] = [];
  const eqCalls: [string, unknown][] = [];
  const inCalls: [string, unknown[]][] = [];
  const ops: { op: string; payload: unknown }[] = [];

  const chain = {
    then: (resolve: (value: Response) => void) => resolve(next()),
    eq: vi.fn((col: string, val: unknown) => {
      eqCalls.push([col, val]);
      return chain;
    }),
    in: vi.fn((col: string, vals: unknown[]) => {
      inCalls.push([col, vals]);
      return chain;
    }),
    maybeSingle: vi.fn(async () => next()),
  };

  const table = {
    select: vi.fn((cols: string) => {
      selectCalls.push(cols);
      return chain;
    }),
    insert: vi.fn((payload: unknown) => {
      ops.push({ op: "insert", payload });
      return chain;
    }),
    update: vi.fn((payload: unknown) => {
      ops.push({ op: "update", payload });
      return chain;
    }),
    delete: vi.fn(() => {
      ops.push({ op: "delete", payload: undefined });
      return chain;
    }),
    upsert: vi.fn((payload: unknown) => {
      ops.push({ op: "upsert", payload });
      return chain;
    }),
  };

  createClientMock.mockResolvedValue({
    from: vi.fn((name: string) => {
      fromCalls.push(name);
      return table;
    }),
  });

  return { fromCalls, selectCalls, eqCalls, inCalls, ops, chain };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminMock.mockResolvedValue({ id: "u1", email: "owner@example.com" });
});

describe("createProduct", () => {
  it("creates a draft product with a unique slug", async () => {
    const { eqCalls, ops, fromCalls } = stubDb([
      { data: [{ slug: "skull-crush-tee" }], error: null },
      { data: null, error: null },
    ]);

    const result = await createProduct({
      name: "  Camiseta Águila ",
      description: "Estampada",
      priceCents: "2500",
      categoryId: "3",
      images: ["https://img/1.jpg"],
    });

    expect(result).toEqual({ ok: true, slug: "camiseta-aguila" });
    expect(fromCalls).toEqual(["products", "products"]);
    expect(ops).toEqual([
      {
        op: "insert",
        payload: {
          slug: "camiseta-aguila",
          name: "Camiseta Águila",
          description: "Estampada",
          price_cents: 2500,
          category_id: 3,
          images: ["https://img/1.jpg"],
          status: "draft",
          published_at: null,
        },
      },
    ]);
    expect(eqCalls).toEqual([]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin", "layout");
  });

  it("appends a numeric suffix when the slug is taken", async () => {
    stubDb([
      { data: [{ slug: "camiseta-aguila" }], error: null },
      { data: null, error: null },
    ]);

    const result = await createProduct({
      name: "Camiseta Águila",
      description: "",
      priceCents: 1000,
      categoryId: 1,
      images: [],
    });

    expect(result).toEqual({ ok: true, slug: "camiseta-aguila-2" });
  });

  it("rejects invalid input without writing", async () => {
    const { ops } = stubDb([]);

    const result = await createProduct({
      name: "",
      description: "",
      priceCents: -5,
      categoryId: 1,
      images: [],
    });

    expect(result.ok).toBe(false);
    expect(ops).toEqual([]);
  });

  it("returns an error when listing slugs fails", async () => {
    stubDb([{ error: { message: "boom" } }]);

    const result = await createProduct({
      name: "Camiseta",
      description: "",
      priceCents: 1000,
      categoryId: 1,
      images: [],
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe("updateProduct", () => {
  it("updates the product keeping the slug untouched", async () => {
    const { eqCalls, ops } = stubDb([{ data: null, error: null }]);

    const result = await updateProduct("camiseta-aguila", {
      name: "Nuevo nombre",
      description: "Nueva desc",
      priceCents: "3000",
      categoryId: "1",
      images: ["https://img/2.jpg"],
    });

    expect(result).toEqual({ ok: true });
    expect(eqCalls).toEqual([["slug", "camiseta-aguila"]]);
    expect(ops[0]).toEqual({
      op: "update",
      payload: expect.objectContaining({
        name: "Nuevo nombre",
        description: "Nueva desc",
        price_cents: 3000,
        category_id: 1,
        images: ["https://img/2.jpg"],
        updated_at: expect.any(String),
      }),
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin", "layout");
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("rejects invalid input without writing", async () => {
    const { ops } = stubDb([]);

    const result = await updateProduct("x", {
      name: "",
      description: "",
      priceCents: "abc",
      categoryId: 1,
      images: [],
    });

    expect(result.ok).toBe(false);
    expect(ops).toEqual([]);
  });
});

describe("setProductStatus", () => {
  it("publishes a product setting published_at", async () => {
    const { ops } = stubDb([{ data: null, error: null }]);

    const result = await setProductStatus("camiseta", true);

    expect(result).toEqual({ ok: true });
    expect(ops[0]).toEqual({
      op: "update",
      payload: {
        status: "published",
        published_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });
  });

  it("unpublishes a product clearing published_at", async () => {
    const { ops } = stubDb([{ data: null, error: null }]);

    const result = await setProductStatus("camiseta", false);

    expect(result).toEqual({ ok: true });
    expect(ops[0]).toEqual({
      op: "update",
      payload: {
        status: "draft",
        published_at: null,
        updated_at: expect.any(String),
      },
    });
  });
});

describe("saveSizes", () => {
  it("replaces sizes, deleting the absent ones", async () => {
    const { eqCalls, inCalls, ops, fromCalls } = stubDb([
      { data: { id: 5 }, error: null },
      { data: [{ size: "M" }, { size: "L" }], error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const result = await saveSizes("camiseta", [
      { size: "M", stock: 3, sortOrder: 0 },
    ]);

    expect(result).toEqual({ ok: true });
    expect(fromCalls).toEqual(["products", "product_sizes", "product_sizes", "product_sizes"]);
    expect(eqCalls).toEqual([
      ["slug", "camiseta"],
      ["product_id", 5],
      ["product_id", 5],
    ]);
    expect(inCalls).toEqual([["size", ["L"]]]);
    expect(ops).toEqual([
      { op: "delete", payload: undefined },
      {
        op: "upsert",
        payload: [
          { product_id: 5, size: "M", stock: 3, sort_order: 0 },
        ],
      },
    ]);
  });

  it("upserts without deleting when no size is removed", async () => {
    const { inCalls, ops } = stubDb([
      { data: { id: 5 }, error: null },
      { data: [{ size: "M" }], error: null },
      { data: null, error: null },
    ]);

    const result = await saveSizes("camiseta", [
      { size: "M", stock: 4, sortOrder: 0 },
    ]);

    expect(result).toEqual({ ok: true });
    expect(inCalls).toEqual([]);
    expect(ops).toEqual([
      {
        op: "upsert",
        payload: [{ product_id: 5, size: "M", stock: 4, sort_order: 0 }],
      },
    ]);
  });

  it("rejects invalid sizes", async () => {
    const { ops } = stubDb([]);

    const result = await saveSizes("camiseta", [{ size: "", stock: -1, sortOrder: 0 }]);

    expect(result.ok).toBe(false);
    expect(ops).toEqual([]);
  });

  it("fails when the product is missing", async () => {
    const { ops } = stubDb([{ data: null, error: null }]);

    const result = await saveSizes("nope", [{ size: "M", stock: 1, sortOrder: 0 }]);

    expect(result.ok).toBe(false);
    expect(ops).toEqual([]);
  });
});

describe("setStock", () => {
  it("updates the per-size stock", async () => {
    const { eqCalls, ops } = stubDb([{ data: null, error: null }]);

    const result = await setStock({ productId: "5", size: "M", stock: "7" });

    expect(result).toEqual({ ok: true });
    expect(eqCalls).toEqual([
      ["product_id", 5],
      ["size", "M"],
    ]);
    expect(ops).toEqual([{ op: "update", payload: { stock: 7 } }]);
  });

  it("rejects invalid input", async () => {
    const { ops } = stubDb([]);

    const result = await setStock({ productId: "abc", size: "", stock: -1 });

    expect(result.ok).toBe(false);
    expect(ops).toEqual([]);
  });
});

describe("removeImage", () => {
  it("deletes the storage object and removes the url from the product", async () => {
    deleteProductImageMock.mockResolvedValue({ ok: true });
    const { ops } = stubDb([
      {
        data: {
          images: [
            "https://x/product-images/camiseta/1.jpg",
            "https://x/product-images/camiseta/2.jpg",
          ],
        },
        error: null,
      },
      { data: null, error: null },
    ]);

    const result = await removeImage("camiseta", "product-images/camiseta/1.jpg");

    expect(result).toEqual({ ok: true });
    expect(deleteProductImageMock).toHaveBeenCalledWith(
      "product-images/camiseta/1.jpg",
    );
    expect(ops).toEqual([
      {
        op: "update",
        payload: expect.objectContaining({
          images: ["https://x/product-images/camiseta/2.jpg"],
          updated_at: expect.any(String),
        }),
      },
    ]);
  });

  it("fails without touching the db when the storage delete fails", async () => {
    deleteProductImageMock.mockResolvedValue({
      ok: false,
      error: "No se pudo borrar la imagen.",
    });
    const { ops } = stubDb([]);

    const result = await removeImage("camiseta", "product-images/camiseta/1.jpg");

    expect(result).toEqual({ ok: false, error: "No se pudo borrar la imagen." });
    expect(ops).toEqual([]);
  });
});