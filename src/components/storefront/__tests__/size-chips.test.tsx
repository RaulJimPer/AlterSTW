import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SizeChips, type SizeOption } from "@/components/storefront/size-chips";

const sizes: SizeOption[] = [
  { size: "S", stock: 4, available: true },
  { size: "M", stock: 0, available: false },
  { size: "L", stock: 2, available: true },
];

describe("SizeChips", () => {
  it("renders every size with stock availability", () => {
    render(<SizeChips sizes={sizes} />);

    const s = screen.getByTitle("4 unidades");
    const m = screen.getByTitle("Agotado");
    const l = screen.getByTitle("2 unidades");

    expect(s).toBeEnabled();
    expect(m).toBeDisabled();
    expect(l).toBeEnabled();
    expect(screen.getByRole("button", { name: /^S$/ })).toBeInTheDocument();
  });

  it("toggles the selected size", () => {
    render(<SizeChips sizes={sizes} />);

    const s = screen.getByRole("button", { name: /^S$/ });
    expect(s).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(s);
    expect(s).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a message when there are no sizes", () => {
    render(<SizeChips sizes={[]} />);
    expect(screen.getByText(/no tiene tallas/i)).toBeInTheDocument();
  });
});