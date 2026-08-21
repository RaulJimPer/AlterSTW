import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import {
  getAnalyticsKpis,
  getCriticalStock,
  getSalesByCategory,
  getSalesSeries,
  getTopProducts,
} from "@/lib/analytics/queries";
import type { AnalyticsRange } from "@/lib/analytics/types";

type TableData = { data?: unknown; error?: { message: string } | null };

function makeChain(result: TableData) {
  const data = result.data ?? null;
  const error = result.error ?? null;
  const chain: Record<string, unknown> = { data, error };
  const self = () => chain;
  chain.select = self;
  chain.gte = self;
  chain.lte = self;
  chain.eq = self;
  chain.ilike = self;
  chain.order = self;
  chain.range = self;
  chain.limit = self;
  chain.maybeSingle = async () => ({ data, error });
  chain.insert = async () => ({ data, error });
  return chain as {
    data: unknown;
    error: { message: string } | null;
    select: () => typeof chain;
    gte: () => typeof chain;
    lte: () => typeof chain;
    eq: () => typeof chain;
    ilike: () => typeof chain;
    order: () => typeof chain;
    range: () => typeof chain;
    limit: () => typeof chain;
    maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
    insert: () => Promise<{ data: unknown; error: unknown }>;
  };
}

function stubTables(tableData: Record<string, TableData>) {
  const from = vi.fn((table: string) => makeChain(tableData[table] ?? {}));
  createClientMock.mockResolvedValue({ from });
  return { from };
}

function range(over: Partial<AnalyticsRange> = {}): AnalyticsRange {
  return {
    key: "30d",
    from: "2026-01-01",
    to: "2026-01-31",
    granularity: "day",
    ...over,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAnalyticsKpis", () => {
  it("returns zeros when there are no orders or visits", async () => {
    stubTables({
      "sales_daily_v": { data: [] },
      "visits_daily_v": { data: [] },
    });

    const kpis = await getAnalyticsKpis(range());

    expect(kpis).toEqual({
      revenueCents: 0,
      paidOrders: 0,
      aovCents: 0,
      conversionRate: 0,
      failedOrders: 0,
      visits: 0,
    });
  });

  it("sums paid/failed orders, revenue, visits and computes aov + conversion", async () => {
    stubTables({
      "sales_daily_v": {
        data: [
          { paid_orders: 2, failed_orders: 1, revenue_cents: 5000 },
          { paid_orders: 3, failed_orders: 0, revenue_cents: 7000 },
        ],
      },
      "visits_daily_v": { data: [{ visits: 100 }] },
    });

    const kpis = await getAnalyticsKpis(range());

    expect(kpis.paidOrders).toBe(5);
    expect(kpis.failedOrders).toBe(1);
    expect(kpis.revenueCents).toBe(12000);
    expect(kpis.aovCents).toBe(2400); // round(12000 / 5)
    expect(kpis.visits).toBe(100);
    expect(kpis.conversionRate).toBeCloseTo(0.05);
  });

  it("throws when the sales query fails", async () => {
    stubTables({
      "sales_daily_v": { error: { message: "boom" } },
      "visits_daily_v": { data: [] },
    });

    await expect(getAnalyticsKpis(range())).rejects.toThrow(
      "Failed to load analytics sales",
    );
  });
});

describe("getSalesSeries", () => {
  it("fills day gaps with zeros", async () => {
    stubTables({
      "sales_daily_v": {
        data: [
          { day: "2026-01-01", paid_orders: 2, revenue_cents: 2000 },
          { day: "2026-01-03", paid_orders: 1, revenue_cents: 1000 },
        ],
      },
      "visits_daily_v": {
        data: [
          { day: "2026-01-01", visits: 10 },
          { day: "2026-01-02", visits: 5 },
        ],
      },
    });

    const series = await getSalesSeries(
      range({ from: "2026-01-01", to: "2026-01-03" }),
    );

    expect(series).toEqual([
      { date: "2026-01-01", revenueCents: 2000, orders: 2, visits: 10 },
      { date: "2026-01-02", revenueCents: 0, orders: 0, visits: 5 },
      { date: "2026-01-03", revenueCents: 1000, orders: 1, visits: 0 },
    ]);
  });

  it("aggregates by week when granularity is week", async () => {
    stubTables({
      "sales_daily_v": {
        data: [
          { day: "2026-01-01", paid_orders: 1, revenue_cents: 2000 },
          { day: "2026-01-02", paid_orders: 1, revenue_cents: 1000 },
        ],
      },
      "visits_daily_v": { data: [] },
    });

    const series = await getSalesSeries(
      range({ from: "2026-01-01", to: "2026-02-15", granularity: "week" }),
    );

    const totalRevenue = series.reduce((s, p) => s + p.revenueCents, 0);
    expect(totalRevenue).toBe(3000);
    expect(series.filter((p) => p.revenueCents > 0)).toHaveLength(1);
  });

  it("handles the 'all' range (no lower bound) via minDay", async () => {
    stubTables({
      "sales_daily_v": {
        data: [
          { day: "2026-01-05", paid_orders: 2, revenue_cents: 2000 },
          { day: "2026-01-20", paid_orders: 3, revenue_cents: 3000 },
        ],
      },
      "visits_daily_v": { data: [] },
    });

    const series = await getSalesSeries(
      range({ key: "all", from: null, to: "2026-01-31", granularity: "week" }),
    );

    const totalRevenue = series.reduce((s, p) => s + p.revenueCents, 0);
    expect(totalRevenue).toBe(5000);
  });
});

describe("getTopProducts", () => {
  it("ranks products by revenue desc and caps at limit", async () => {
    stubTables({
      "order_items": {
        data: [
          {
            product_slug: "a",
            product_name: "A",
            qty: 2,
            unit_price_cents: 1000,
            orders: { created_at: "2026-01-01" },
          },
          {
            product_slug: "a",
            product_name: "A",
            qty: 1,
            unit_price_cents: 1000,
            orders: { created_at: "2026-01-02" },
          },
          {
            product_slug: "b",
            product_name: "B",
            qty: 10,
            unit_price_cents: 500,
            orders: { created_at: "2026-01-01" },
          },
        ],
      },
    });

    const top = await getTopProducts(range(), 5);

    expect(top.map((p) => p.slug)).toEqual(["b", "a"]);
    expect(top[0]).toEqual({
      slug: "b",
      name: "B",
      qty: 10,
      revenueCents: 5000,
    });
  });
});

describe("getSalesByCategory", () => {
  it("groups order revenue by category name", async () => {
    stubTables({
      "products": {
        data: [
          { slug: "a", categories: { name: "Cat1" } },
          { slug: "b", categories: { name: "Cat2" } },
        ],
      },
      "order_items": {
        data: [
          {
            product_slug: "a",
            qty: 2,
            unit_price_cents: 1000,
            orders: { created_at: "2026-01-01" },
          },
          {
            product_slug: "b",
            qty: 1,
            unit_price_cents: 5000,
            orders: { created_at: "2026-01-01" },
          },
        ],
      },
    });

    const categories = await getSalesByCategory(range());

    expect(categories).toEqual([
      { categoryName: "Cat2", revenueCents: 5000 },
      { categoryName: "Cat1", revenueCents: 2000 },
    ]);
  });
});

describe("getCriticalStock", () => {
  it("returns sizes with stock <= 3", async () => {
    stubTables({
      "products": {
        data: [
          {
            id: 1,
            slug: "a",
            name: "A",
            categories: { name: "Cat1" },
            product_sizes: [
              { size: "M", stock: 2, sort_order: 0 },
              { size: "L", stock: 5, sort_order: 1 },
            ],
          },
          {
            id: 2,
            slug: "b",
            name: "B",
            categories: { name: "Cat2" },
            product_sizes: [{ size: "S", stock: 0, sort_order: 0 }],
          },
        ],
      },
    });

    const critical = await getCriticalStock(3);

    expect(critical.map((r) => `${r.productSlug}:${r.size}`).sort()).toEqual([
      "a:M",
      "b:S",
    ]);
  });
});
