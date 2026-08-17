import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getOrderMock } = vi.hoisted(() => ({
  getOrderMock: vi.fn(),
}));

vi.mock("@/lib/orders/queries", () => ({
  getOrderByCheckoutSessionId: getOrderMock,
}));

vi.mock("@/components/storefront/checkout/clear-cart-once", () => ({
  ClearCartOnce: () => null,
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import CheckoutSuccessPage from "@/app/(storefront)/checkout/success/page";

const ORDER = {
  id: 42,
  checkoutSessionId: "cs_test_abc",
  customerEmail: "cliente@example.com",
  status: "paid",
  emailStatus: "sent",
  emailSentAt: "2026-08-18T10:31:00.000Z",
  subtotalCents: 5000,
  totalCents: 5000,
  createdAt: "2026-08-18T10:30:00.000Z",
  items: [
    {
      productSlug: "skull-crush-tee",
      productName: "Skull Crush Tee",
      size: "M",
      qty: 2,
      unitPriceCents: 2500,
    },
  ],
};

async function renderPage(sessionId = "cs_test_abc") {
  return render(
    await CheckoutSuccessPage({
      searchParams: Promise.resolve({ session_id: sessionId }),
    }),
  );
}

describe("checkout success page", () => {
  it("renders the confirming state while the webhook has not landed", async () => {
    getOrderMock.mockResolvedValue(null);

    await renderPage();

    expect(
      screen.getByRole("heading", { name: /estamos confirmando tu pedido/i }),
    ).toBeInTheDocument();
  });

  it("renders the stored order summary once confirmed", async () => {
    getOrderMock.mockResolvedValue(ORDER);

    await renderPage();

    expect(screen.getByText(/pedido nº 42/i)).toBeInTheDocument();
    expect(screen.getByText("Skull Crush Tee")).toBeInTheDocument();
    expect(screen.getByText(/talla M · 2 uds\./i)).toBeInTheDocument();
    expect(screen.getByText("cliente@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("50,00 €").length).toBeGreaterThan(0);
  });

  it("renders a stock-failed notice when the order could not be fulfilled", async () => {
    getOrderMock.mockResolvedValue({ ...ORDER, status: "stock_failed" });

    await renderPage();

    expect(
      screen.getByRole("heading", { name: /se acabó antes de lo esperado/i }),
    ).toBeInTheDocument();
  });

  it("redirects home when the session_id query param is missing", async () => {
    await expect(
      CheckoutSuccessPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/");
  });

  it("degrades to the confirming state when the read fails", async () => {
    getOrderMock.mockRejectedValue(new Error("db down"));

    await renderPage();

    expect(
      screen.getByRole("heading", { name: /estamos confirmando tu pedido/i }),
    ).toBeInTheDocument();
  });
});