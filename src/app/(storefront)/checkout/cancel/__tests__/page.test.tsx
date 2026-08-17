import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CheckoutCancelPage from "@/app/(storefront)/checkout/cancel/page";

describe("checkout cancel page", () => {
  it("reassures the customer and links back without touching the cart", async () => {
    const { container } = render(await CheckoutCancelPage());

    expect(
      screen.getByRole("heading", { name: /te esperamos en la tienda/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no se ha cobrado nada/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Revisar el carrito" })).toHaveAttribute(
      "href",
      "/carrito",
    );
    expect(screen.getByRole("link", { name: "Seguir explorando" })).toHaveAttribute(
      "href",
      "/productos",
    );
    expect(container).not.toHaveTextContent("alterstw_cart");
  });
});