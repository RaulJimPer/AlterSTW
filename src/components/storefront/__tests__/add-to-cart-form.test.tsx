import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

const { addToCartMock } = vi.hoisted(() => ({
  addToCartMock: vi.fn(),
}));

vi.mock("@/lib/cart/actions", () => ({ addToCart: addToCartMock }));

import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { CartProvider } from "@/components/storefront/cart/cart-context";
import { EMPTY_CART } from "@/lib/cart/types";
import type { SizeOption } from "@/components/storefront/size-chips";

const sizes: SizeOption[] = [
  { size: "S", stock: 4, available: true },
  { size: "M", stock: 3, available: true },
  { size: "L", stock: 0, available: false },
];

const renderForm = (props: {
  slug?: string;
  outOfStock?: boolean;
  sizes?: SizeOption[];
} = {}) =>
  render(
    <CartProvider cart={EMPTY_CART}>
      <AddToCartForm
        slug={props.slug ?? "skull-crush-tee"}
        sizes={props.sizes ?? sizes}
        outOfStock={props.outOfStock ?? false}
      />
    </CartProvider>,
  );

describe("AddToCartForm", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("prompts for a size before adding anything", () => {
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Añadir al carrito" }));

    expect(
      screen.getByText("Elige una talla para añadirla al carrito."),
    ).toBeInTheDocument();
    expect(addToCartMock).not.toHaveBeenCalled();
  });

  it("adds the selected size and opens the cart sheet", async () => {
    addToCartMock.mockResolvedValue({ ok: true, cart: EMPTY_CART });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /^M$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Añadir al carrito" }));

    expect(addToCartMock).toHaveBeenCalledWith({
      slug: "skull-crush-tee",
      size: "M",
    });
    expect(await screen.findByText("Añadido al carrito.")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Carrito" })).toBeInTheDocument();
  });

  it("surfaces the error returned by the server action", async () => {
    addToCartMock.mockResolvedValue({
      ok: false,
      error: "No hay stock suficiente de esa talla.",
    });
    renderForm();

    fireEvent.click(screen.getByRole("button", { name: /^S$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Añadir al carrito" }));

    expect(
      await screen.findByText("No hay stock suficiente de esa talla."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Carrito" })).not.toBeInTheDocument();
  });

  it("renders the sold-out branch without a size selector", () => {
    renderForm({ outOfStock: true });

    expect(screen.getByRole("button", { name: "Agotado" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Avisarme" })).toBeInTheDocument();
    expect(screen.queryByText("Tallas")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^S$/ })).not.toBeInTheDocument();
  });
});