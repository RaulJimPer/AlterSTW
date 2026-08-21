import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

const { push, searchParams } = vi.hoisted(() => ({
  push: vi.fn(),
  searchParams: new URLSearchParams("foo=bar"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}));

import { RangeSelector } from "@/components/admin/analytics/range-selector";

describe("RangeSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.delete("range");
    searchParams.delete("from");
    searchParams.delete("to");
    searchParams.set("foo", "bar");
  });

  it("pushes the chosen preset without custom dates", () => {
    render(<RangeSelector />);
    fireEvent.click(screen.getByRole("button", { name: "90 días" }));

    expect(push).toHaveBeenCalledWith("/admin/analytics?foo=bar&range=90d");
  });

  it("preserves other params when applying a custom range", () => {
    render(<RangeSelector />);
    fireEvent.change(screen.getByLabelText(/Desde/), {
      target: { value: "2026-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Hasta/), {
      target: { value: "2026-01-31" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(push).toHaveBeenCalledWith(
      "/admin/analytics?foo=bar&range=custom&from=2026-01-01&to=2026-01-31",
    );
  });
});
