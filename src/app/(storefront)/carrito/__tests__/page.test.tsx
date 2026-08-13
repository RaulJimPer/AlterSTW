import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CartState } from "@/lib/cart/types";
import type { CartLine } from "@/lib/cart/zod";

const { readCartMock, resolveCartMock } = vi.hoisted(() => ({
  readCartMock: vi.fn<() => Promise<CartLine[]>>(async () => []),
  resolveCartMock: vi.fn<() => Promise<CartState>>(),
}));

vi.mock("@/lib/cart/cart", () => ({ readCart: readCartMock }));
vi.mock("@/lib/cart/queries", () => ({ resolveCart: resolveCartMock }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

import CartPage, { metadata } from "@/app/(storefront)/carrito/page";
import { buildCartState } from "@/lib/cart/totals";
import type { CartLineItem } from "@/lib/cart/types";

const filledCart = buildCartState([
  {
    slug: "skull-crush-tee",
    size: "M",
    qty: 2,
    name: "Skull Crush Tee",
    image: "/images/seed/skull-crush.jpg",
    priceCents: 2500,
    stock: 3,
    available: true,
  } satisfies CartLineItem,
]);

describe("CartPage", () => {
  it("exposes the cart metadata", () => {
    expect(metadata.title).toBe("Carrito");
  });

  it("re-resolves the cookie lines and renders them", async () => {
    const lines = [{ slug: "skull-crush-tee", size: "M", qty: 2 }];
    readCartMock.mockResolvedValue(lines);
    resolveCartMock.mockResolvedValue(filledCart);

    render(await CartPage());

    expect(readCartMock).toHaveBeenCalled();
    expect(resolveCartMock).toHaveBeenCalledWith(lines);
    expect(screen.getByRole("heading", { level: 1, name: "Tu carro" })).toBeInTheDocument();
    expect(screen.getByText("Skull Crush Tee")).toBeInTheDocument();
    // line total (qty 2 x 25,00) and subtotal render the same amount
    expect(screen.getAllByText("50,00 €")).toHaveLength(2);
  });

  it("renders the empty state when the cookie has no lines", async () => {
    readCartMock.mockResolvedValue([]);
    resolveCartMock.mockResolvedValue(buildCartState([]));

    render(await CartPage());

    expect(screen.getByText("NADA POR AQUÍ")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al catálogo" })).toHaveAttribute(
      "href",
      "/productos",
    );
  });
});