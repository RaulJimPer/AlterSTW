import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, signInWithPasswordMock, signOutMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  signInWithPasswordMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signOut: signOutMock,
    },
  }),
}));

import { loginWithPassword, logout } from "@/lib/auth/actions";

describe("loginWithPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("signs in with valid credentials and redirects to /admin", async () => {
    signInWithPasswordMock.mockResolvedValue({ error: null });

    await expect(
      loginWithPassword({
        email: "  DUENO@EXAMPLE.COM ",
        password: "secreto",
      }),
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "dueno@example.com",
      password: "secreto",
    });
    expect(redirectMock).toHaveBeenCalledWith("/admin");
  });

  it("returns an error for invalid input without calling supabase", async () => {
    const result = await loginWithPassword({
      email: "no-un-email",
      password: "",
    });

    expect(result).toEqual({ ok: false, error: expect.any(String) });
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("returns an error when supabase rejects the credentials", async () => {
    signInWithPasswordMock.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });

    const result = await loginWithPassword({
      email: "owner@example.com",
      password: "wrong",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("No se pudo iniciar sesión");
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("signs out and redirects to /admin/login", async () => {
    signOutMock.mockResolvedValue({ error: null });

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");

    expect(signOutMock).toHaveBeenCalled();
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });
});