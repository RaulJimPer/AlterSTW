import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";

describe("AddToCartButton", () => {
  it("blocks purchase and offers a waiting list when out of stock", () => {
    render(<AddToCartButton outOfStock />);
    const add = screen.getByRole("button", { name: "Agotado" });
    expect(add).toBeDisabled();
    expect(screen.getByRole("button", { name: "Avisarme" })).toBeEnabled();
  });

  it("announces the cart placeholder after clicking", () => {
    render(<AddToCartButton outOfStock={false} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /añadir al carrito/i }));

    const notice = screen.getByRole("status");
    expect(notice).toHaveAttribute("aria-live", "polite");
    expect(notice).toHaveTextContent(/carrito/i);
  });
});