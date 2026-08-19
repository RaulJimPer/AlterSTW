import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const nav = vi.hoisted(() => ({
  defaultParams: "",
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: nav.replace }),
  useSearchParams: () => new URLSearchParams(nav.defaultParams),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    onClick,
    children,
  }: {
    href: string;
    onClick?: () => void;
    children: React.ReactNode;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

import { FilterForm } from "@/components/storefront/filter-form";
import type { Category } from "@/lib/catalog/types";

const categories: Category[] = [
  { id: "1", slug: "camisetas", name: "Camisetas", sortOrder: 1 },
  { id: "2", slug: "sudaderas", name: "Sudaderas", sortOrder: 2 },
];
const sizes = ["S", "M", "L"];

const GROUP_HEADERS = ["Categoría", "Talla", "Precio (€)", "Estado"];

function panelEl(button: HTMLElement): HTMLElement | null {
  return document.getElementById(button.getAttribute("aria-controls") ?? "");
}

describe("FilterForm accordion", () => {
  beforeEach(() => {
    nav.defaultParams = "";
    nav.replace.mockClear();
  });

  it("starts with every group closed and panels hidden", () => {
    render(<FilterForm categories={categories} sizes={sizes} />);

    for (const header of GROUP_HEADERS) {
      const button = screen.getByRole("button", { name: header });
      expect(button).toHaveAttribute("aria-expanded", "false");
      expect(panelEl(button)).toHaveAttribute("hidden");
    }
  });

  it("toggles a group independently, keeping others open", () => {
    render(<FilterForm categories={categories} sizes={sizes} />);

    const catButton = screen.getByRole("button", { name: "Categoría" });
    const tallaButton = screen.getByRole("button", { name: "Talla" });

    fireEvent.click(catButton);
    expect(catButton).toHaveAttribute("aria-expanded", "true");
    expect(panelEl(catButton)).not.toHaveAttribute("hidden");

    fireEvent.click(catButton);
    expect(catButton).toHaveAttribute("aria-expanded", "false");
    expect(panelEl(catButton)).toHaveAttribute("hidden");

    fireEvent.click(catButton);
    fireEvent.click(tallaButton);
    expect(catButton).toHaveAttribute("aria-expanded", "true");
    expect(tallaButton).toHaveAttribute("aria-expanded", "true");
  });

  it("Limpiar points to /productos and closes every group", () => {
    render(<FilterForm categories={categories} sizes={sizes} />);

    const catButton = screen.getByRole("button", { name: "Categoría" });
    const tallaButton = screen.getByRole("button", { name: "Talla" });
    fireEvent.click(catButton);
    fireEvent.click(tallaButton);

    const limpiar = screen.getByRole("link", { name: "Limpiar" });
    expect(limpiar).toHaveAttribute("href", "/productos");

    fireEvent.click(limpiar);
    expect(catButton).toHaveAttribute("aria-expanded", "false");
    expect(tallaButton).toHaveAttribute("aria-expanded", "false");
  });

  it("re-derives defaults from a clean URL after navigation", () => {
    nav.defaultParams = "cat=camisetas&talla=M&av=disponible&min=1000&max=2000";

    const { container, rerender } = render(
      <FilterForm categories={categories} sizes={sizes} />,
    );

    nav.defaultParams = "";
    rerender(<FilterForm categories={categories} sizes={sizes} />);

    const catTodas = container.querySelector(
      'input[name="cat"][value=""]',
    ) as HTMLInputElement;
    const tallaTodas = container.querySelector(
      'input[name="talla"][value=""]',
    ) as HTMLInputElement;
    const avTodos = container.querySelector(
      'input[name="av"][value="todos"]',
    ) as HTMLInputElement;
    const min = container.querySelector('input[name="min"]') as HTMLInputElement;

    expect(catTodas.checked).toBe(true);
    expect(tallaTodas.checked).toBe(true);
    expect(avTodos.checked).toBe(true);
    expect(min.value).toBe("");
  });

  it("renders an active-filter group closed with its chip available", () => {
    nav.defaultParams = "cat=camisetas";

    const { container } = render(
      <FilterForm categories={categories} sizes={sizes} />,
    );

    const catButton = screen.getByRole("button", { name: "Categoría" });
    expect(catButton).toHaveAttribute("aria-expanded", "false");

    expect(
      screen.getByRole("button", { name: "Quitar filtro Camisetas" }),
    ).toBeInTheDocument();

    const camisetaRadio = container.querySelector(
      'input[name="cat"][value="camisetas"]',
    ) as HTMLInputElement;
    expect(camisetaRadio.checked).toBe(true);
  });
});
