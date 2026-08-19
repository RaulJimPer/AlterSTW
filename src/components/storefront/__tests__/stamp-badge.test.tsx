import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StampBadge } from "@/components/storefront/stamp-badge";
import { FlashSticker } from "@/components/storefront/flash-sticker";
import { HangingPriceTag } from "@/components/storefront/hanging-price-tag";

describe("StampBadge", () => {
  it("renders the label", () => {
    render(<StampBadge variant="agotado" label="AGOTADO" />);
    expect(screen.getByText("AGOTADO")).toBeInTheDocument();
  });

  it("applies the void solid style for agotado", () => {
    const { container } = render(<StampBadge variant="agotado" label="AGOTADO" />);
    expect(container.querySelector("span")?.className).toContain("bg-void");
  });
});

describe("FlashSticker", () => {
  it("renders the label with the default yellow style", () => {
    const { container } = render(<FlashSticker label="NUEVO" />);
    expect(screen.getByText("NUEVO")).toBeInTheDocument();
    expect(container.querySelector("span")?.className).toContain("bg-yellow");
  });
});

describe("HangingPriceTag", () => {
  it("formats prices in euros", () => {
    render(<HangingPriceTag cents={2490} />);
    expect(screen.getByText(/24,90/)).toBeInTheDocument();
  });
});