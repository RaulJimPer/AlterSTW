import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

let mockPathname = "/";

import { Header } from "@/components/storefront/header";

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
    render(<Header categories={categories} />);

    expect(screen.getByRole("link", { name: /altersti?w/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Carrito (0 productos)" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Catálogo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Camisetas" })).toHaveAttribute(
      "href",
      "/productos?cat=camisetas",
    );
    expect(screen.getAllByRole("search")).toHaveLength(1);
  });

  it("opens the mobile navigation and closes it on category click", () => {
    render(<Header categories={categories} />);

    const toggle = screen.getByRole("button", { name: /menú/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const mobileCategory = screen.getAllByRole("link", { name: "Camisetas" }).at(-1);
    fireEvent.click(mobileCategory as HTMLElement);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});