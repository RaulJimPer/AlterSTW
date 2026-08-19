import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  getAdminOrderById,
  getAdminOrders,
  getAdminProductBySlug,
  getAdminProducts,
  getInventoryRows,
} from "@/lib/admin/queries";

type StubConfig = {
  data?: unknown;
  count?: number | null;
  error?: { message: string } | null;
};

function stubQuery(config: StubConfig) {
  const chain = {
    data: config.data,
    count: config.count ?? null,
    error: config.error ?? null,
    eq: vi.fn(),
    ilike: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
    maybeSingle: vi.fn(async () => ({
      data: config.data,
      error: config.error ?? null,
    })),
  };
  chain.eq.mockImplementation(() => chain);
  chain.ilike.mockImplementation(() => chain);
  chain.order.mockImplementation(() => chain);
  chain.range.mockImplementation(() => chain);
  const select = vi.fn(() => chain);
  return { select, chain };
}

function stubDb(select: ReturnType<typeof vi.fn>) {
  createClientMock.mockResolvedValue({ from: vi.fn(() => ({ select })) });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAdminProducts", () => {
  it("maps rows adding stockTotal and pagination metadata", async () => {
    const { select } = stubQuery({
      data: [
        {
          id: 1,
          slug: "skull-crush-tee",
          name: "Skull Crush Tee",
          price_cents: 2500,
          status: "published",
          published_at: "2026-08-10T00:00:00.000Z",
          updated_at: "2026-08-18T00:00:00.000Z",
          categories: { name: "Camisetas" },
          product_sizes: [{ stock: 3 }, { stock: 0 }, { stock: 2 }],
        },
        {
          id: 2,
          slug: "draft-hoodie",
          name: "Draft Hoodie",
          price_cents: 4500,
          status: "draft",
          published_at: null,
          updated_at: "2026-08-19T00:00:00.000Z",
          categories: { name: "Sudaderas" },
          product_sizes: [],
        },
      ],
      count: 2,
    });
    stubDb(select);

    const page = await getAdminProducts({ page: 1 });

    expect(page.total).toBe(2);
    expect(page.items).toEqual([
      {
        id: "1",
        slug: "skull-crush-tee",
        name: "Skull Crush Tee",
        categoryName: "Camisetas",
        priceCents: 2500,
        status: "published",
        publishedAt: "2026-08-10T00:00:00.000Z",
        updatedAt: "2026-08-18T00:00:00.000Z",
        stockTotal: 5,
      },
      {
        id: "2",
        slug: "draft-hoodie",
        name: "Draft Hoodie",
        categoryName: "Sudaderas",
        priceCents: 4500,
        status: "draft",
        publishedAt: null,
        updatedAt: "2026-08-19T00:00:00.000Z",
        stockTotal: 0,
      },
    ]);
  });

  it("applies filters and pagination to the query", async () => {
    const { select, chain } = stubQuery({ data: [], count: 0 });
    stubDb(select);

    await getAdminProducts({ status: "draft", categoryId: "3", q: "tee", page: 2 });

    expect(chain.eq).toHaveBeenCalledWith("status", "draft");
    expect(chain.eq).toHaveBeenCalledWith("category_id", "3");
    expect(chain.ilike).toHaveBeenCalledWith("name", "%tee%");
    expect(chain.order).toHaveBeenCalledWith("updated_at", {
      ascending: false,
    });
    expect(chain.range).toHaveBeenCalledWith(20, 39);
  });

  it("throws when the query fails", async () => {
    const { select } = stubQuery({
      data: null,
      error: { message: "boom" },
    });
    stubDb(select);

    await expect(getAdminProducts({ page: 1 })).rejects.toThrow(
      "Failed to load admin products",
    );
  });
});

describe("getAdminProductBySlug", () => {
  it("maps the detail with sizes ordered by sort_order", async () => {
    const { select } = stubQuery({
      data: {
        id: 1,
        slug: "skull-crush-tee",
        name: "Skull Crush Tee",
        description: "Una camiseta",
        price_cents: 2500,
        category_id: 1,
        images: ["https://img/1.jpg"],
        status: "published",
        published_at: "2026-08-10T00:00:00.000Z",
        product_sizes: [
          { size: "L", stock: 2, sort_order: 2 },
          { size: "M", stock: 3, sort_order: 1 },
          { size: "XS", stock: 0, sort_order: 0 },
        ],
      },
    });
    stubDb(select);

    const detail = await getAdminProductBySlug("skull-crush-tee");

    expect(detail).toEqual({
      id: "1",
      slug: "skull-crush-tee",
      name: "Skull Crush Tee",
      description: "Una camiseta",
      priceCents: 2500,
      categoryId: "1",
      images: ["https://img/1.jpg"],
      status: "published",
      publishedAt: "2026-08-10T00:00:00.000Z",
      sizes: [
        { size: "XS", stock: 0, sortOrder: 0 },
        { size: "M", stock: 3, sortOrder: 1 },
        { size: "L", stock: 2, sortOrder: 2 },
      ],
    });
  });

  it("returns null for an unknown slug", async () => {
    const { select } = stubQuery({ data: null });
    stubDb(select);

    expect(await getAdminProductBySlug("nope")).toBeNull();
  });

  it("throws when the query fails", async () => {
    const { select } = stubQuery({ error: { message: "boom" } });
    stubDb(select);

    await expect(getAdminProductBySlug("x")).rejects.toThrow(
      "Failed to load admin product",
    );
  });
});

describe("getAdminOrders", () => {
  it("maps order rows with filters", async () => {
    const { select, chain } = stubQuery({
      data: [
        {
          id: 1,
          checkout_session_id: "cs_test_1",
          customer_email: "a@b.co",
          status: "paid",
          email_status: "sent",
          total_cents: 5000,
          created_at: "2026-08-18T00:00:00.000Z",
        },
      ],
      count: 1,
    });
    stubDb(select);

    const page = await getAdminOrders({ status: "paid", emailStatus: "sent", page: 1 });

    expect(chain.eq).toHaveBeenCalledWith("status", "paid");
    expect(chain.eq).toHaveBeenCalledWith("email_status", "sent");
    expect(chain.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(page.items).toEqual([
      {
        id: "1",
        checkoutSessionId: "cs_test_1",
        customerEmail: "a@b.co",
        status: "paid",
        emailStatus: "sent",
        totalCents: 5000,
        createdAt: "2026-08-18T00:00:00.000Z",
      },
    ]);
  });

  it("throws when the query fails", async () => {
    const { select } = stubQuery({ error: { message: "boom" } });
    stubDb(select);

    await expect(getAdminOrders({ page: 1 })).rejects.toThrow(
      "Failed to load admin orders",
    );
  });
});

describe("getAdminOrderById", () => {
  it("maps a full order with its items into an OrderSummary", async () => {
    const { select } = stubQuery({
      data: {
        id: 1,
        checkout_session_id: "cs_test_1",
        customer_email: "a@b.co",
        status: "paid",
        email_status: "pending",
        email_sent_at: null,
        subtotal_cents: 5000,
        total_cents: 5000,
        created_at: "2026-08-18T00:00:00.000Z",
        order_items: [
          {
            product_slug: "skull-crush-tee",
            product_name: "Skull Crush Tee",
            size: "M",
            qty: 2,
            unit_price_cents: 2500,
          },
        ],
      },
    });
    stubDb(select);

    const order = await getAdminOrderById(1);

    expect(order).toEqual({
      id: 1,
      checkoutSessionId: "cs_test_1",
      customerEmail: "a@b.co",
      status: "paid",
      emailStatus: "pending",
      emailSentAt: null,
      subtotalCents: 5000,
      totalCents: 5000,
      createdAt: "2026-08-18T00:00:00.000Z",
      items: [
        {
          productSlug: "skull-crush-tee",
          productName: "Skull Crush Tee",
          size: "M",
          qty: 2,
          unitPriceCents: 2500,
        },
      ],
    });
  });

  it("returns null for a non-numeric id", async () => {
    stubDb(vi.fn());
    expect(await getAdminOrderById("abc")).toBeNull();
  });

  it("returns null for a missing order", async () => {
    const { select } = stubQuery({ data: null });
    stubDb(select);

    expect(await getAdminOrderById(99)).toBeNull();
  });

  it("throws when the query fails", async () => {
    const { select } = stubQuery({ error: { message: "boom" } });
    stubDb(select);

    await expect(getAdminOrderById(1)).rejects.toThrow(
      "Failed to load admin order",
    );
  });
});

describe("getInventoryRows", () => {
  it("flattens products into one row per size, ordered by product name", async () => {
    const { select } = stubQuery({
      data: [
        {
          id: 1,
          slug: "a",
          name: "Alpha",
          categories: { name: "Camisetas" },
          product_sizes: [
            { size: "M", stock: 3, sort_order: 0 },
            { size: "L", stock: 1, sort_order: 1 },
          ],
        },
        {
          id: 2,
          slug: "b",
          name: "Beta",
          categories: { name: "Sudaderas" },
          product_sizes: [{ size: "Única", stock: 0, sort_order: 0 }],
        },
      ],
    });
    stubDb(select);

    const rows = await getInventoryRows();

    expect(rows).toEqual([
      {
        productId: "1",
        productSlug: "a",
        productName: "Alpha",
        categoryName: "Camisetas",
        size: "M",
        stock: 3,
        sortOrder: 0,
      },
      {
        productId: "1",
        productSlug: "a",
        productName: "Alpha",
        categoryName: "Camisetas",
        size: "L",
        stock: 1,
        sortOrder: 1,
      },
      {
        productId: "2",
        productSlug: "b",
        productName: "Beta",
        categoryName: "Sudaderas",
        size: "Única",
        stock: 0,
        sortOrder: 0,
      },
    ]);
  });

  it("throws when the query fails", async () => {
    const { select } = stubQuery({ error: { message: "boom" } });
    stubDb(select);

    await expect(getInventoryRows()).rejects.toThrow(
      "Failed to load inventory",
    );
  });
});