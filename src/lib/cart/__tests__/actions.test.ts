import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesStore,
  cookiesMock,
  revalidatePathMock,
  getProductBySlugMock,
} = vi.hoisted(() => {
  const store = new Map<string, { value: string }>();
  return {
    cookiesStore: store,
    cookiesMock: vi.fn(() => ({
      get: (name: string) => store.get(name),
      set: (name: string, value: string) => {
        store.set(name, { value });
      },
      delete: (name: string) => {
        store.delete(name);
      },
    })),
    revalidatePathMock: vi.fn(),
    getProductBySlugMock: vi.fn(),
  };
});

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/catalog/queries", () => ({
  getProductBySlug: getProductBySlugMock,
  FALLBACK_IMAGE: "/images/seed/fallback.svg",
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { addToCart, removeLine, setQuantity } from "@/lib/cart/actions";
import { CART_COOKIE } from "@/lib/cart/cart";
import { CART_ERROR_MESSAGES } from "@/lib/cart/errors";
import { createClient } from "@/lib/supabase/server";
import { MAX_LINES } from "@/lib/cart/zod";
import type { CartLine } from "@/lib/cart/zod";

const GENERIC_ERROR = "No se pudo actualizar el carrito. Inténtalo de nuevo.";

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

function enableProduct(
  slug: string,
  sizes: { size: string; stock: number }[],
): void {
  getProductBySlugMock.mockResolvedValue({
    id: "1",
    slug,
    name: "Skull Crush Tee",
    priceCents: 2500,
    image: "/images/seed/skull-crush.jpg",
    images: ["/images/seed/skull-crush.jpg"],
    categorySlug: "camisetas",
    categoryName: "Camisetas",
    stockTotal: 3,
    badge: null,
    publishedAt: "",
    description: "Camiseta negra de algodón orgánico.",
    sizes: sizes.map((item) => ({ ...item, available: item.stock > 0 })),
  });
}

function stubDb(): void {
  stubs.set("catalog_products_v", {
    data: [
      {
        id: 1,
        slug: "skull-crush-tee",
        name: "Skull Crush Tee",
        price_cents: 2500,
        images: ["/images/seed/skull-crush.jpg"],
      },
    ],
    error: null,
  });
  stubs.set("product_sizes", {
    data: [{ product_id: 1, size: "M", stock: 3 }],
    error: null,
  });
  vi.mocked(createClient).mockResolvedValue(db as never);
}

function setCookie(lines: CartLine[]): void {
  cookiesStore.set(CART_COOKIE, { value: JSON.stringify(lines) });
}

beforeEach(() => {
  cookiesStore.clear();
  stubs.clear();
  calls.length = 0;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("addToCart", () => {
  const input = { slug: "skull-crush-tee", size: "M" };

  it("adds a new line, persists it and revalidates the layout", async () => {
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);
    stubDb();

    const result = await addToCart(input);

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.cart.lines).toEqual([
        expect.objectContaining({ slug: input.slug, size: "M", qty: 1 }),
      ]);
    }
    expect(JSON.parse(cookiesStore.get(CART_COOKIE)?.value ?? "[]")).toEqual([
      { ...input, qty: 1 },
    ]);
    expect(revalidatePathMock).toHaveBeenCalledWith("/", "layout");
  });

  it("consolidates repeated adds of the same slug and size", async () => {
    setCookie([{ ...input, qty: 1 }]);
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);
    stubDb();

    const result = await addToCart(input);

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.cart.lines[0].qty).toBe(2);
    }
  });

  it("refuses adding when the quantity would exceed stock", async () => {
    setCookie([{ ...input, qty: 3 }]);
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);
    stubDb();

    const result = await addToCart(input);

    expect(result).toEqual({
      ok: false,
      error: CART_ERROR_MESSAGES["out-of-stock"],
    });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects a product that is no longer in the catalog", async () => {
    getProductBySlugMock.mockResolvedValue(null);
    stubDb();

    const result = await addToCart(input);

    expect(result).toEqual({
      ok: false,
      error: CART_ERROR_MESSAGES["not-found"],
    });
  });

  it("rejects a malformed payload", async () => {
    const result = await addToCart({ slug: "  ", size: "M" });

    expect(result).toEqual({
      ok: false,
      error: CART_ERROR_MESSAGES["not-found"],
    });
  });

  it("refuses a new line once the cart is full", async () => {
    const full = Array.from({ length: MAX_LINES }, (_, index) => ({
      slug: `producto-${index}`,
      size: "S",
      qty: 1,
    }));
    setCookie(full);
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);
    stubDb();

    const result = await addToCart(input);

    expect(result).toEqual({
      ok: false,
      error: CART_ERROR_MESSAGES["limit-lines"],
    });
  });
});

describe("setQuantity", () => {
  const input = { slug: "skull-crush-tee", size: "M", qty: 4 };

  it("clamps the requested quantity to available stock", async () => {
    setCookie([{ slug: input.slug, size: "M", qty: 2 }]);
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);
    stubDb();

    const result = await setQuantity(input);

    expect(result).toMatchObject({ ok: true });
    if (result.ok) {
      expect(result.cart.lines[0].qty).toBe(3);
    }
  });

  it("removes the line when the quantity drops to zero", async () => {
    setCookie([{ slug: input.slug, size: "M", qty: 2 }]);
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);
    stubDb();

    const result = await setQuantity({ ...input, qty: 0 });

    expect(result).toMatchObject({ ok: true });
    if (result.ok) expect(result.cart.lines).toHaveLength(0);
  });

  it("no-ops for a line that is not in the cart", async () => {
    enableProduct(input.slug, [{ size: "M", stock: 3 }]);

    const result = await setQuantity(input);

    expect(result).toEqual({ ok: true, cart: expect.anything() });
    expect(revalidatePathMock).toHaveBeenCalled();
    expect(cookiesStore.has(CART_COOKIE)).toBe(false);
  });

  it("rejects a product that is no longer in the catalog", async () => {
    setCookie([{ slug: input.slug, size: "M", qty: 1 }]);
    getProductBySlugMock.mockResolvedValue(null);

    const result = await setQuantity(input);

    expect(result).toEqual({
      ok: false,
      error: CART_ERROR_MESSAGES["not-found"],
    });
  });

  it("rejects a quantity beyond the schema bounds", async () => {
    const result = await setQuantity({ ...input, qty: -5 });

    expect(result).toEqual({ ok: false, error: GENERIC_ERROR });
  });
});

describe("removeLine", () => {
  it("removes the matching line and persists the change", async () => {
    setCookie([{ slug: "skull-crush-tee", size: "M", qty: 2 }]);
    stubDb();

    const result = await removeLine({ slug: "skull-crush-tee", size: "M" });

    expect(result).toMatchObject({ ok: true });
    expect(JSON.parse(cookiesStore.get(CART_COOKIE)?.value ?? "[]")).toEqual([]);
    expect(revalidatePathMock).toHaveBeenCalled();
  });

  it("is a no-op when the line does not exist", async () => {
    const result = await removeLine({ slug: "skull-crush-tee", size: "M" });

    expect(result).toEqual({ ok: true, cart: expect.anything() });
  });

  it("rejects a malformed payload", async () => {
    const result = await removeLine({ slug: "", size: "" });

    expect(result).toEqual({ ok: false, error: GENERIC_ERROR });
  });
});