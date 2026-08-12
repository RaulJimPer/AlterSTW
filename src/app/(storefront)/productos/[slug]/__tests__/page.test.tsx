import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { notFoundMock, getProductBySlugMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  getProductBySlugMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

vi.mock("@/lib/catalog/queries", () => ({
  getProductBySlug: getProductBySlugMock,
}));

import ProductPage, {
  generateMetadata,
} from "@/app/(storefront)/productos/[slug]/page";
import type { ProductDetail } from "@/lib/catalog/types";

const detail: ProductDetail = {
  id: "1",
  slug: "skull-crush-tee",
  name: "Skull Crush Tee",
  priceCents: 2500,
  image: "/images/seed/skull-crush.jpg",
  images: ["/images/seed/skull-crush.jpg"],
  categorySlug: "camisetas",
  categoryName: "Camisetas",
  stockTotal: 0,
  badge: "agotado",
  publishedAt: "2026-08-13T00:00:00Z",
  description: "Camiseta negra de algodón orgánico con print de calavera.",
  sizes: [
    { size: "S", stock: 0, available: false },
    { size: "M", stock: 3, available: true },
  ],
};

describe("ProductPage", () => {
  it("calls notFound for an unknown slug", async () => {
    vi.mocked(getProductBySlugMock).mockResolvedValue(null);

    await expect(
      ProductPage({ params: Promise.resolve({ slug: "no-existe" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the detail with truthful AGOTADO state", async () => {
    vi.mocked(getProductBySlugMock).mockResolvedValue(detail);

    const element = await ProductPage({
      params: Promise.resolve({ slug: "skull-crush-tee" }),
    });
    render(element);

    expect(screen.getByRole("heading", { level: 1, name: "Skull Crush Tee" })).toBeInTheDocument();
    expect(screen.getByText("AGOTADO")).toBeInTheDocument();
    expect(screen.getByText(/25,00/)).toBeInTheDocument();
    const add = screen.getByRole("button", { name: "Agotado" });
    expect(add).toBeDisabled();
    expect(screen.getByText(/calavera/)).toBeInTheDocument();
  });

  it("disables unavailable sizes but keeps the rest clickable", async () => {
    vi.mocked(getProductBySlugMock).mockResolvedValue(detail);

    const element = await ProductPage({
      params: Promise.resolve({ slug: "skull-crush-tee" }),
    });
    render(element);

    expect(screen.getByRole("button", { name: /\(agotado\)/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^M$/ })).toBeEnabled();
  });
});

describe("generateMetadata", () => {
  it("describes published products for SEO", async () => {
    vi.mocked(getProductBySlugMock).mockResolvedValue(detail);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "skull-crush-tee" }),
    });

    expect(metadata.title).toBe("Skull Crush Tee");
    expect(metadata.openGraph?.title).toContain("AlterSTW");
    expect(metadata.openGraph?.images).toEqual(["/images/seed/skull-crush.jpg"]);
  });

  it("returns empty metadata for unknown slugs", async () => {
    vi.mocked(getProductBySlugMock).mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: "no-existe" }),
    });

    expect(metadata).toEqual({});
  });
});