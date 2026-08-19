import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/lib/admin/actions", () => ({
  setProductStatus: vi.fn(),
}));

const { getAdminProductsMock } = vi.hoisted(() => ({
  getAdminProductsMock: vi.fn(),
}));

vi.mock("@/lib/admin/queries", () => ({
  getAdminProducts: getAdminProductsMock,
}));

vi.mock("@/lib/catalog/queries", () => ({
  getCategories: vi.fn(async () => [
    { id: "1", slug: "camisetas", name: "Camisetas", sortOrder: 1 },
  ]),
}));

import AdminProductsPage, {
  productListHref,
} from "@/app/admin/(panel)/productos/page";
import type { AdminProductFilters } from "@/lib/admin/zod";
import type { AdminProductListRow } from "@/lib/admin/types";

const row: AdminProductListRow = {
  id: "1",
  slug: "camiseta-punk",
  name: "Camiseta punk",
  categoryName: "Camisetas",
  priceCents: 2490,
  status: "published",
  publishedAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-18T10:00:00Z",
  stockTotal: 12,
};

const rowDraft: AdminProductListRow = {
  ...row,
  id: "2",
  slug: "chaqueta-denim",
  name: "Chaqueta denim",
  priceCents: 1500,
  status: "draft",
  updatedAt: "2026-08-17T10:00:00Z",
};

describe("AdminProductsPage", () => {
  it("renders the empty state when nothing matches", async () => {
    getAdminProductsMock.mockResolvedValue({ items: [], total: 0 });

    const element = await AdminProductsPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(
      screen.getByText("No hay productos con estos filtros."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders the table with status pill and inline publish action", async () => {
    getAdminProductsMock.mockResolvedValue({ items: [row, rowDraft], total: 2 });

    const element = await AdminProductsPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(screen.getByText("2 productos")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Camiseta punk" }),
    ).toHaveAttribute("href", "/admin/productos/camiseta-punk/editar");
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText("Borrador")).toBeInTheDocument();
    expect(screen.getByText("24,90 €")).toBeInTheDocument();
    expect(screen.getByText("15,00 €")).toBeInTheDocument();
    expect(screen.getAllByText("Despublicar").length).toBe(1);
    expect(screen.getAllByText("Publicar").length).toBe(1);
  });

  it("lets the filters flow into the query and keeps the search form", async () => {
    getAdminProductsMock.mockResolvedValue({ items: [], total: 0 });

    const element = await AdminProductsPage({
      searchParams: Promise.resolve({ status: "draft", q: "punk" }),
    });
    render(element);

    expect(getAdminProductsMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft", q: "punk", page: 1 }),
    );
    expect(screen.getByPlaceholderText("Buscar por nombre…")).toHaveValue("punk");
    expect(screen.getByRole("link", { name: "Publicados" })).toHaveAttribute(
      "href",
      "/admin/productos?status=published&q=punk&page=1",
    );
  });

  it("renders Ver más when there are more pages", async () => {
    getAdminProductsMock.mockResolvedValue({ items: [row], total: 25 });

    const element = await AdminProductsPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    const more = screen.getByRole("link", { name: "Ver más" });
    expect(more).toHaveAttribute("href", "/admin/productos?page=2");
  });
});

describe("productListHref", () => {
  it("keeps the active filters and only bumps the page", () => {
    const filters: AdminProductFilters = {
      status: "draft",
      categoryId: "1",
      q: "punk",
      page: 1,
    };
    expect(productListHref(filters, 2)).toBe(
      "/admin/productos?status=draft&categoryId=1&q=punk&page=2",
    );
  });

  it("omits the default filters", () => {
    const filters: AdminProductFilters = { page: 3 };
    expect(productListHref(filters, 4)).toBe("/admin/productos?page=4");
  });
});