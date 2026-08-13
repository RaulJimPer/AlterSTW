import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { CartSheet } from "@/components/storefront/cart/cart-sheet";
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

describe("CartSheet", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when closed", () => {
    render(<CartSheet cart={buildCartState([])} open={false} onClose={() => {}} />);

    expect(screen.queryByRole("dialog", { name: "Carrito" })).not.toBeInTheDocument();
  });

  it("renders the empty state when the cart has no lines", () => {
    render(<CartSheet cart={buildCartState([])} open onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: "Carrito" })).toBeInTheDocument();
    expect(screen.getByText("NADA POR AQUÍ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al catálogo" })).toHaveAttribute(
      "href",
      "/productos",
    );
  });

  it("renders lines, the live subtotal and the disabled checkout CTA", () => {
    const cart = buildCartState([AVAILABLE_TEE]);
    render(<CartSheet cart={cart} open onClose={() => {}} />);

    expect(screen.getByText("Skull Crush Tee")).toBeInTheDocument();
    expect(screen.getByText("Talla M")).toBeInTheDocument();
    // 2500 * 2 = 5000 cents -> 50,00 EUR (matches both the line total and the subtotal)
    expect(screen.getAllByText("50,00 €")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Finalizar compra" }),
    ).toBeDisabled();
    // 003 ships the checkout; until then the CTA explains itself.
    expect(
      screen.getByText(/La pasarela de pago llega en la siguiente actualización\./),
    ).toBeInTheDocument();
  });

  it("links to the full cart page only when there are lines", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <CartSheet
        cart={buildCartState([AVAILABLE_TEE])}
        open
        onClose={onClose}
      />,
    );

    const link = screen.getByRole("link", { name: /ver carrito completo/i });
    expect(link).toHaveAttribute("href", "/carrito");
    fireEvent.click(link);
    expect(onClose).toHaveBeenCalled();

    rerender(<CartSheet cart={buildCartState([])} open onClose={onClose} />);
    expect(screen.queryByRole("link", { name: /ver carrito completo/i })).not.toBeInTheDocument();
  });

  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<CartSheet cart={buildCartState([])} open onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes via the Cerrar button", () => {
    const onClose = vi.fn();
    render(<CartSheet cart={buildCartState([])} open onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("focuses the panel and locks scroll on open, restoring both on close", () => {
    const { rerender } = render(
      <CartSheet cart={buildCartState([])} open onClose={() => {}} />,
    );

    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    rerender(<CartSheet cart={buildCartState([])} open={false} onClose={() => {}} />);

    expect(document.body.style.overflow).toBe("");
  });
});