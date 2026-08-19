import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { notFoundMock, getAdminOrderByIdMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getAdminOrderByIdMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/admin/queries", () => ({
  getAdminOrderById: getAdminOrderByIdMock,
}));

import AdminOrderPage from "@/app/admin/(panel)/pedidos/[id]/page";
import type { OrderSummary } from "@/lib/orders/types";

const summary: OrderSummary = {
  id: 7,
  checkoutSessionId: "cs_test_abc123",
  customerEmail: "cliente@example.com",
  status: "paid",
  emailStatus: "sent",
  emailSentAt: "2026-08-18T12:01:00Z",
  subtotalCents: 4980,
  totalCents: 4980,
  createdAt: "2026-08-18T12:00:00Z",
  items: [
    {
      productSlug: "camiseta-punk",
      productName: "Camiseta punk",
      size: "M",
      qty: 2,
      unitPriceCents: 2490,
    },
  ],
};

describe("AdminOrderPage", () => {
  it("calls notFound for an unknown order", async () => {
    getAdminOrderByIdMock.mockResolvedValue(null);

    await expect(
      AdminOrderPage({ params: Promise.resolve({ id: "999" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the order detail with lines and totals", async () => {
    getAdminOrderByIdMock.mockResolvedValue(summary);

    const element = await AdminOrderPage({ params: Promise.resolve({ id: "7" }) });
    render(element);

    expect(
      screen.getByRole("heading", { level: 1, name: "Pedido #7" }),
    ).toBeInTheDocument();
    expect(screen.getByText("cliente@example.com")).toBeInTheDocument();
    expect(screen.getByText("Pagado")).toBeInTheDocument();
    expect(screen.getByText("Email: Enviado")).toBeInTheDocument();
    expect(screen.getByText("Camiseta punk")).toBeInTheDocument();
    expect(screen.getByText("cs_test_abc123")).toBeInTheDocument();
    expect(screen.getAllByText("49,80 €").length).toBe(3);
  });
});