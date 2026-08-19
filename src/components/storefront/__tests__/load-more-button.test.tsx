import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LoadMoreButton } from "@/components/storefront/load-more-button";

describe("LoadMoreButton", () => {
  it("renders nothing when there are no more pages", () => {
    const { container } = render(<LoadMoreButton href="/productos?page=2" hasMore={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("links to the next page when more products exist", () => {
    render(<LoadMoreButton href="/productos?page=2" hasMore />);
    const link = screen.getByRole("link", { name: "Ver más" });
    expect(link).toHaveAttribute("href", "/productos?page=2");
  });
});