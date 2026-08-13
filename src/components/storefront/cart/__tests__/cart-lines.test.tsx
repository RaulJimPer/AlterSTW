import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refreshMock } = vi.hoisted(() => ({ refreshMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

const { setQuantityMock, removeLineMock } = vi.hoisted(() => ({
  setQuantityMock: vi.fn(() => Promise.resolve({ ok: true })),
  removeLineMock: vi.fn(() => Promise.resolve({ ok: true })),
}));

vi.mock("@/lib/cart/actions", () => ({
  setQuantity: setQuantityMock,
  removeLine: removeLineMock,
}));

import { CartLines } from "@/components/storefront/cart/cart-lines";
import { buildCartState } from "@/lib/cart/totals";
import type { CartLineItem } from "@/lib/cart/types";

const AVAILABLE_TEE: CartLineItem = {
  slug: "skull-crush-tee",
  size: "M",
  qty: 2,
  name: "Skull Crush Tee",
  image: "/images/seed/skull-crush.jpg",
  priceCents: 2500,
  stock: 3,
  available: true,
};

describe("CartLines", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the empty state with a link back to the catalog", () => {
    render(<CartLines cart={buildCartState([])} />);

    expect(screen.getByText("NADA POR AQUÍ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al catálogo" })).toHaveAttribute(
      "href",
      "/productos",
    );
  });

  it("shows unit price, line total, subtotal and the payment placeholder", () => {
    render(<CartLines cart={buildCartState([AVAILABLE_TEE])} />);

    expect(screen.getByText("Skull Crush Tee")).toBeInTheDocument();
    expect(screen.getByText("Talla M")).toBeInTheDocument();
    expect(screen.getByText("25,00 €")).toBeInTheDocument();
    // qty 2 x 25,00 = line total, which matches the subtotal here
    expect(screen.getAllByText("50,00 €")).toHaveLength(2);
    expect(screen.getByText("Sin incluir envío.")).toBeInTheDocument();
    expect(
      screen.getByText(/La pasarela de pago llega en la siguiente actualización\./),
    ).toBeInTheDocument();
  });

  it("increments quantity via the plus stepper and refreshes the router", async () => {
    render(<CartLines cart={buildCartState([AVAILABLE_TEE])} />);

    fireEvent.click(
      screen.getByRole("button", { name: /sumar una unidad de skull crush tee/i }),
    );

    expect(setQuantityMock).toHaveBeenCalledWith({
      slug: AVAILABLE_TEE.slug,
      size: AVAILABLE_TEE.size,
      qty: 3,
    });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("decrements quantity via the minus stepper and refreshes the router", async () => {
    render(<CartLines cart={buildCartState([AVAILABLE_TEE])} />);

    fireEvent.click(
      screen.getByRole("button", { name: /restar una unidad de skull crush tee/i }),
    );

    expect(setQuantityMock).toHaveBeenCalledWith({
      slug: AVAILABLE_TEE.slug,
      size: AVAILABLE_TEE.size,
      qty: 1,
    });
    await waitFor(() => expect(refreshMock).toHaveBeenCalled());
  });

  it("disables the minus stepper at quantity one and the plus stepper at stock", () => {
    const singleUnit: CartLineItem = { ...AVAILABLE_TEE, qty: 1 };
    const { rerender } = render(<CartLines cart={buildCartState([singleUnit])} />);

    expect(
      screen.getByRole("button", { name: /restar una unidad de skull crush tee/i }),
    ).toBeDisabled();

    const atStock: CartLineItem = { ...AVAILABLE_TEE, qty: 3 };
    rerender(<CartLines cart={buildCartState([atStock])} />);

    expect(
      screen.getByRole("button", { name: /sumar una unidad de skull crush tee/i }),
    ).toBeDisabled();
  });

  it("removes a line and flags the checkout CTA when the cart turns invalid", () => {
    const soldOut: CartLineItem = {
      ...AVAILABLE_TEE,
      qty: 0,
      stock: 0,
      priceCents: null,
      available: false,
    };
    render(<CartLines cart={buildCartState([soldOut])} />);

    expect(screen.getByText("No disponible")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sumar una unidad de skull crush tee/i }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Finalizar compra" })).toBeDisabled();
    expect(
      screen.getByText(/Ajusta la cantidad de cada talla al stock disponible\./),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /quitar skull crush tee \(talla m\)/i }),
    );
    expect(removeLineMock).toHaveBeenCalledWith({
      slug: AVAILABLE_TEE.slug,
      size: AVAILABLE_TEE.size,
    });
  });
});