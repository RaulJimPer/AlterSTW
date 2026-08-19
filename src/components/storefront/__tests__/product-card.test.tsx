import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCard } from "@/components/storefront/product-card";
import type { ProductSummary } from "@/lib/catalog/types";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" src={props.src} sizes={props.sizes} className={props.className} />
  ),
}));

const base: ProductSummary = {
  id: "1",
  slug: "camiseta-punk",
  name: "Camiseta punk",
  priceCents: 2490,
  image: "/images/seed/camiseta-punk-1.svg",
  categorySlug: "punk",
  categoryName: "Punk",
  stockTotal: 12,
  badge: null,
  publishedAt: "2026-01-02T12:00:00Z",
};

describe("ProductCard", () => {
  it("links to the product detail and shows name, category and price", () => {
    render(<ProductCard product={base} />);

    const link = screen.getByRole("link", { name: /camiseta punk/i });
    expect(link).toHaveAttribute("href", "/productos/camiseta-punk");
expect(screen.getByText("Punk")).toBeInTheDocument();
    expect(screen.getByText(/24,90/)).toBeInTheDocument();
  });

  it("shows NUEVO sticker for new badges", () => {
    render(<ProductCard product={{ ...base, badge: "nuevo" }} />);
    expect(screen.getByText("NUEVO")).toBeInTheDocument();
  });

  it("shows ÚLTIMAS stamp for low-stock badges", () => {
    render(<ProductCard product={{ ...base, badge: "ultimas" }} />);
    expect(screen.getByText("ÚLTIMAS")).toBeInTheDocument();
  });

  it("shows a second-hand sticker for vintage items without badges", () => {
    render(
      <ProductCard
        product={{
          ...base,
          categorySlug: "vintage",
          categoryName: "Vintage",
          badge: null,
        }}
      />,
    );
    expect(screen.getByText("2.ª MANO")).toBeInTheDocument();
  });

  it("does not show second-hand on agotado items", () => {
    render(
      <ProductCard
        product={{
          ...base,
          categorySlug: "vintage",
          categoryName: "Vintage",
          badge: "agotado",
        }}
      />,
    );
    expect(screen.queryByText("2.ª MANO")).not.toBeInTheDocument();
  });
});