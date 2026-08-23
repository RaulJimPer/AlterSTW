import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  AnalyticsKpis,
  CategorySales,
  SeriesPoint,
  TopProduct,
} from "@/lib/analytics/types";
import type { InventoryRow } from "@/lib/admin/types";

const zeroKpis: AnalyticsKpis = {
  revenueCents: 0,
  paidOrders: 0,
  aovCents: 0,
  conversionRate: 0,
  failedOrders: 0,
  visits: 0,
};
const manyKpis: AnalyticsKpis = {
  revenueCents: 12000,
  paidOrders: 5,
  aovCents: 2400,
  conversionRate: 0.05,
  failedOrders: 1,
  visits: 100,
};

const state = {
  kpis: zeroKpis,
  series: [] as SeriesPoint[],
  top: [] as TopProduct[],
  cats: [] as CategorySales[],
  stock: [] as InventoryRow[],
};

vi.mock("@/lib/analytics/queries", () => ({
  getAnalyticsKpis: vi.fn(async () => state.kpis),
  getSalesSeries: vi.fn(async () => state.series),
  getTopProducts: vi.fn(async () => state.top),
  getSalesByCategory: vi.fn(async () => state.cats),
  getCriticalStock: vi.fn(async () => state.stock),
}));

vi.mock("@/components/admin/analytics/range-selector", () => ({
  RangeSelector: () => null,
}));
vi.mock("@/components/admin/analytics/sales-chart", () => ({
  SalesChart: () => null,
}));
vi.mock("@/components/admin/analytics/visits-conversion-chart", () => ({
  VisitsConversionChart: () => null,
}));
vi.mock("@/components/admin/analytics/top-products-chart", () => ({
  TopProductsChart: () => null,
}));
vi.mock("@/components/admin/analytics/category-donut", () => ({
  CategoryDonut: () => null,
}));

import AnalyticsPage from "@/app/admin/(panel)/analytics/page";

async function renderPage(params: Record<string, string>) {
  return render(
    await AnalyticsPage({ searchParams: Promise.resolve(params) }),
  );
}

describe("AnalyticsPage", () => {
  it("renders KPIs for a range with orders and visits", async () => {
    state.kpis = manyKpis;
    state.series = [
      { date: "2026-01-01", revenueCents: 12000, orders: 5, visits: 100 },
    ];
    state.top = [{ slug: "a", name: "A", qty: 2, revenueCents: 2000 }];
    state.cats = [{ categoryName: "Cat1", revenueCents: 2000 }];

    await renderPage({ range: "30d" });

    expect(await screen.findByText("5.0%")).toBeInTheDocument();
    expect(screen.getByText("120,00 €")).toBeInTheDocument();
    expect(screen.getByText("24,00 €")).toBeInTheDocument();
    expect(screen.getByText("5 paid")).toBeInTheDocument();
    expect(screen.getByText("/ 1 fallidos")).toBeInTheDocument();
  });

  it("renders the empty state when there are no orders and no visits", async () => {
    state.kpis = zeroKpis;
    state.series = [];
    state.top = [];
    state.cats = [];

    await renderPage({ range: "30d" });

    expect(
      await screen.findByText(/No hay pedidos ni visitas en este rango/i),
    ).toBeInTheDocument();
  });

  it("never renders NaN in the conversion KPI", async () => {
    state.kpis = zeroKpis;
    await renderPage({});

    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
