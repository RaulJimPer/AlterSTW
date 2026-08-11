import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" {...props} />
  ),
}));

import Home from "@/app/page";

describe("Home", () => {
  it("renders the main heading with the getting-started copy", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /to get started, edit the page\.tsx file/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders at least one action link", () => {
    render(<Home />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
  });
});