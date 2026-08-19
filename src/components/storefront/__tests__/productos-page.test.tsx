import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

vi.mock("@/lib/catalog/queries", () => ({
  getCategories: vi.fn(async () => [
    { id: "1", slug: "camisetas", name: "Camisetas", sortOrder: 1 },
  ]),
  getAvailableSizes: vi.fn(async () => ["S", "M", "L"]),
  getPublishedProducts: vi.fn(),
}));

vi.mock("@/components/storefront/sort-select", () => ({
  SortSelect: () => <div data-testid="sort-select" />,
}));
vi.mock("@/components/storefront/filter-sidebar", () => ({
  FilterSidebar: () => <aside data-testid="filter-sidebar" />,
}));
vi.mock("@/components/storefront/mobile-filter-sheet", () => ({
  MobileFilterSheet: () => <div data-testid="mobile-filter-sheet" />,
}));

import {
  getAvailableSizes,
  getCategories,
  getPublishedProducts,
} from "@/lib/catalog/queries";
import CatalogPage, { loadMoreHref } from "@/app/(storefront)/productos/page";
import type { ProductSummary } from "@/lib/catalog/types";
import type { CatalogFilters } from "@/lib/validation/catalog";

const item: ProductSummary = {
  id: "1",
  slug: "camiseta-punk",
  name: "Camiseta punk",
  priceCents: 2490,
  image: "/images/seed/camiseta-punk-1.svg",
  categorySlug: "camisetas",
  categoryName: "Camisetas",
  stockTotal: 12,
  badge: null,
  publishedAt: "2026-01-02T12:00:00Z",
};

describe("CatalogPage", () => {
  it("renders the empty state when nothing matches", async () => {
    vi.mocked(getPublishedProducts).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 24,
      total: 0,
      hasMore: false,
    });

    const element = await CatalogPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByText("NADA POR AQUÍ")).toBeInTheDocument();
    expect(screen.queryByText(/^\d+ productos/)).not.toBeInTheDocument();
  });

  it("renders the product grid, count and Ver más from the query page", async () => {
    vi.mocked(getPublishedProducts).mockResolvedValue({
      items: [item],
      page: 1,
      pageSize: 24,
      total: 12,
      hasMore: true,
    });

    const element = await CatalogPage({ searchParams: Promise.resolve({}) });
    render(element);

    expect(screen.getByText("12 productos")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /camiseta punk/i })).toBeInTheDocument();
    const more = screen.getByRole("link", { name: "Ver más" });
    expect(more).toHaveAttribute("href", "/productos?page=2");
  });

  it("lets the server-side filters flow into the catalog query", async () => {
    vi.mocked(getPublishedProducts).mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 24,
      total: 0,
      hasMore: false,
    });

    const element = await CatalogPage({
      searchParams: Promise.resolve({ cat: "camisetas", q: "punk" }),
    });
    render(element);

    expect(getCategories).toHaveBeenCalled();
    expect(getAvailableSizes).toHaveBeenCalled();
    expect(getPublishedProducts).toHaveBeenCalledWith(
      expect.objectContaining({ cat: "camisetas", q: "punk" }),
    );
  });
});

describe("loadMoreHref", () => {
  it("keeps filters and only bumps the page", () => {
    const filters: CatalogFilters = {
      cat: "pantalones",
      talla: "M",
      min: 1000,
      max: 5000,
      av: "ultimas",
      sort: "precio-desc",
      q: "cargo",
      page: 1,
    };
    expect(loadMoreHref(filters, 2)).toBe(
      "/productos?cat=pantalones&talla=M&min=1000&max=5000&av=ultimas&sort=precio-desc&q=cargo&page=2",
    );
  });

  it("omits default filters", () => {
    const filters: CatalogFilters = { av: "todos", sort: "nuevos", page: 3 };
    expect(loadMoreHref(filters, 4)).toBe("/productos?page=4");
  });
});