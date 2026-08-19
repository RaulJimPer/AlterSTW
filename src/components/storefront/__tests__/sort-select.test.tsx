import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => "/productos",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams("sort=nuevos&cat=punk"),
}));

import { SortSelect } from "@/components/storefront/sort-select";

describe("SortSelect", () => {
  beforeEach(() => {
    replace.mockClear();
  });

  it("selects the current sort from the URL", () => {
    render(<SortSelect />);
    expect(screen.getByRole("combobox")).toHaveValue("nuevos");
  });

  it("rewrites the URL preserving other filters", () => {
    render(<SortSelect />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "precio-desc" } });
    expect(replace).toHaveBeenCalledWith("/productos?sort=precio-desc&cat=punk");
  });
});