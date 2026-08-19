import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { loginWithPasswordMock } = vi.hoisted(() => ({
  loginWithPasswordMock: vi.fn(),
}));

vi.mock("@/lib/auth/actions", () => ({
  loginWithPassword: loginWithPasswordMock,
}));

import { LoginForm } from "@/components/admin/login-form";

describe("LoginForm", () => {
  it("submits the credentials to the server action", async () => {
    loginWithPasswordMock.mockResolvedValue({ ok: true });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "Admin@Example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "secreto" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("button", { name: "Entrando…" })).toBeInTheDocument();
    expect(loginWithPasswordMock).toHaveBeenCalledWith({
      email: "Admin@Example.com",
      password: "secreto",
    });
  });

  it("surfaces the server-side error without redirecting", async () => {
    loginWithPasswordMock.mockResolvedValue({
      ok: false,
      error: "No se pudo iniciar sesión. Revisa tus credenciales.",
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "admin@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Contraseña"), {
      target: { value: "mal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("No se pudo iniciar sesión. Revisa tus credenciales."),
    ).toBeInTheDocument();
  });
});