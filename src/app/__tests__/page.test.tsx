import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

vi.mock("@/lib/catalog/queries", () => ({
  getCategories: vi.fn(async () => [
    { id: "1", slug: "punk", name: "Punk", sortOrder: 0 },
  ]),
  getPublishedProducts: vi.fn(async () => ({
    items: [],
    page: 1,
    pageSize: 24,
    total: 0,
    hasMore: false,
  })),
}));

import HomePage from "@/app/(storefront)/page";

describe("Home (storefront)", () => {
  it("renders the brand hero heading", async () => {
    const element = await HomePage();
    render(element);
    expect(
      screen.getByRole("heading", { level: 1, name: /diferente/i }),
    ).toBeInTheDocument();
  });
});