import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/storefront/empty-state";

describe("EmptyState", () => {
  it("shows the NADA POR AQUÍ stamp and a way back", () => {
    render(<EmptyState />);
    expect(screen.getByText("NADA POR AQUÍ")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /catálogo completo/i });
    expect(link).toHaveAttribute("href", "/productos");
  });

  it("honours a custom reset href", () => {
    render(<EmptyState resetHref="/productos?cat=punk" />);
    expect(screen.getByRole("link", { name: /catálogo completo/i })).toHaveAttribute(
      "href",
      "/productos?cat=punk",
    );
  });
});