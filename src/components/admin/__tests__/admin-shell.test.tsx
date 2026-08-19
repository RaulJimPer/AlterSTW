import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/productos",
}));

vi.mock("@/lib/auth/actions", () => ({
  logout: vi.fn(),
}));

import { AdminShell } from "@/components/admin/admin-shell";

describe("AdminShell", () => {
  it("renders the nav, the admin email and the logout button at the top", () => {
    render(
      <AdminShell adminEmail="owner@alterstw.es">
        <p>Contenido</p>
      </AdminShell>,
    );

    expect(screen.getByRole("link", { name: "Productos" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Inventario" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Pedidos" })).toBeInTheDocument();
    expect(screen.getByText("owner@alterstw.es")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cerrar sesión" })).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });
});