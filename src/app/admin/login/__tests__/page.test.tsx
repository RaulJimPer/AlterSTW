import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth/actions", () => ({
  loginWithPassword: vi.fn(),
}));

import AdminLoginPage from "@/app/admin/login/page";

describe("AdminLoginPage", () => {
  it("renders the login card with credentials fields", () => {
    render(<AdminLoginPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Acceso al panel" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });
});