import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getAdminOrdersMock } = vi.hoisted(() => ({
  getAdminOrdersMock: vi.fn(),
}));

vi.mock("@/lib/admin/queries", () => ({
  getAdminOrders: getAdminOrdersMock,
}));

import AdminOrdersPage, {
  orderListHref,
} from "@/app/admin/(panel)/pedidos/page";
import type { AdminOrderFilters } from "@/lib/admin/zod";
import type { AdminOrderListItem } from "@/lib/admin/types";

const order: AdminOrderListItem = {
  id: "7",
  checkoutSessionId: "cs_test_abc123",
  customerEmail: "cliente@example.com",
  status: "paid",
  emailStatus: "sent",
  totalCents: 4980,
  createdAt: "2026-08-18T12:00:00Z",
};

const orderFailed: AdminOrderListItem = {
  ...order,
  id: "8",
  customerEmail: "otro@example.com",
  status: "stock_failed",
  emailStatus: "failed",
  totalCents: 2490,
  createdAt: "2026-08-18T13:00:00Z",
};

describe("AdminOrdersPage", () => {
  it("renders the empty state when nothing matches", async () => {
    getAdminOrdersMock.mockResolvedValue({ items: [], total: 0 });

    const element = await AdminOrdersPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(
      screen.getByText("No hay pedidos con estos filtros."),
    ).toBeInTheDocument();
  });

  it("renders the order table with totals and statuses", async () => {
    getAdminOrdersMock.mockResolvedValue({ items: [order, orderFailed], total: 2 });

    const element = await AdminOrdersPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(screen.getByText("2 pedidos")).toBeInTheDocument();
    const table = screen.getByRole("table");
    expect(within(table).getByRole("link", { name: "#7" })).toHaveAttribute(
      "href",
      "/admin/pedidos/7",
    );
    expect(within(table).getByText("cliente@example.com")).toBeInTheDocument();
    expect(within(table).getByText("otro@example.com")).toBeInTheDocument();
    expect(within(table).getByText("49,80 €")).toBeInTheDocument();
    expect(within(table).getByText("Pagado")).toBeInTheDocument();
    expect(within(table).getByText("Sin stock")).toBeInTheDocument();
    expect(within(table).getByText("Enviado")).toBeInTheDocument();
    expect(within(table).getByText("Falló")).toBeInTheDocument();
  });

  it("lets the filters flow into the query", async () => {
    getAdminOrdersMock.mockResolvedValue({ items: [], total: 0 });

    const element = await AdminOrdersPage({
      searchParams: Promise.resolve({ status: "stock_failed", emailStatus: "failed" }),
    });
    render(element);

    expect(getAdminOrdersMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "stock_failed",
        emailStatus: "failed",
        page: 1,
      }),
    );
  });

  it("renders Ver más when there are more pages", async () => {
    getAdminOrdersMock.mockResolvedValue({ items: [order], total: 25 });

    const element = await AdminOrdersPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    const more = screen.getByRole("link", { name: "Ver más" });
    expect(more).toHaveAttribute("href", "/admin/pedidos?page=2");
  });

  it("does not show a reset-filters link when no filter is active", async () => {
    getAdminOrdersMock.mockResolvedValue({ items: [], total: 0 });

    const element = await AdminOrdersPage({
      searchParams: Promise.resolve({}),
    });
    render(element);

    expect(
      screen.queryByRole("link", { name: "Limpiar filtros" }),
    ).not.toBeInTheDocument();
  });

  it("shows a reset-filters link when a filter is active", async () => {
    getAdminOrdersMock.mockResolvedValue({ items: [], total: 0 });

    const element = await AdminOrdersPage({
      searchParams: Promise.resolve({ status: "stock_failed" }),
    });
    render(element);

    expect(screen.getByRole("link", { name: "Limpiar filtros" })).toHaveAttribute(
      "href",
      "/admin/pedidos",
    );
  });
});

describe("orderListHref", () => {
  it("keeps the active filters and only bumps the page", () => {
    const filters: AdminOrderFilters = {
      status: "paid",
      emailStatus: "pending",
      page: 2,
    };
    expect(orderListHref(filters, 3)).toBe(
      "/admin/pedidos?status=paid&emailStatus=pending&page=3",
    );
  });

  it("omits the default filters", () => {
    const filters: AdminOrderFilters = { page: 1 };
    expect(orderListHref(filters, 2)).toBe("/admin/pedidos?page=2");
  });
});