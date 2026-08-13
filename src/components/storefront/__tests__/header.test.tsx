import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

let mockPathname = "/";

import { CartProvider } from "@/components/storefront/cart/cart-context";
import { Header } from "@/components/storefront/header";
import { EMPTY_CART } from "@/lib/cart/types";

const categories = [
  { id: "1", slug: "camisetas", name: "Camisetas", sortOrder: 1 },
  { id: "2", slug: "chaquetas", name: "Chaquetas", sortOrder: 2 },
];

describe("Header", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shows the brand, the empty cart badge and the desktop category links", () => {
    render(
      <CartProvider cart={EMPTY_CART}>
        <Header categories={categories} cart={EMPTY_CART} />
      </CartProvider>,
    );

    expect(screen.getByRole("link", { name: /altersti?w/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("button", { name: "Carrito (0 productos)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catálogo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Camisetas" })).toHaveAttribute(
      "href",
      "/productos?cat=camisetas",
    );
    expect(screen.getAllByRole("search")).toHaveLength(1);
  });

  it("shows the live cart count in the masthead badge", () => {
    const cart = {
      lines: [
        {
          slug: "skull-crush-tee",
          size: "M",
          qty: 2,
          name: "Skull Crush Tee",
          image: "/images/seed/skull-crush.jpg",
          priceCents: 2500,
          stock: 3,
          available: true,
        },
      ],
      subtotalCents: 5000,
      count: 2,
      valid: true,
    };
    render(
      <CartProvider cart={cart}>
        <Header categories={categories} cart={cart} />
      </CartProvider>,
    );

    expect(screen.getByRole("button", { name: "Carrito (2 productos)" })).toBeInTheDocument();
  });

  it("opens the cart sheet from the masthead badge", () => {
    render(
      <CartProvider cart={EMPTY_CART}>
        <Header categories={categories} cart={EMPTY_CART} />
      </CartProvider>,
    );

    expect(screen.queryByRole("dialog", { name: "Carrito" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Carrito (0 productos)" }));
    expect(screen.getByRole("dialog", { name: "Carrito" })).toBeInTheDocument();
  });

  it("opens the mobile navigation and closes it on category click", () => {
    render(
      <CartProvider cart={EMPTY_CART}>
        <Header categories={categories} cart={EMPTY_CART} />
      </CartProvider>,
    );

    const toggle = screen.getByRole("button", { name: /menú/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const mobileCategory = screen.getAllByRole("link", { name: "Camisetas" }).at(-1);
    fireEvent.click(mobileCategory as HTMLElement);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});