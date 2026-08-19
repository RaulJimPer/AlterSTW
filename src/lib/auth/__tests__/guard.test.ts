import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, getUserMock, adminQueryMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  getUserMock: vi.fn(),
  adminQueryMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: getUserMock },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => adminQueryMock(),
        }),
      }),
    }),
  }),
}));

import { getAdminUser, requireAdmin } from "@/lib/auth/guard";

describe("getAdminUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when there is no signed-in user", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    expect(await getAdminUser()).toBeNull();
  });

  it("returns null when the user has no email", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: null } },
      error: null,
    });

    expect(await getAdminUser()).toBeNull();
  });

  it("returns null when the user is not in admin_users", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "someone@example.com" } },
      error: null,
    });
    adminQueryMock.mockResolvedValue({ data: null, error: null });

    expect(await getAdminUser()).toBeNull();
  });

  it("returns null when the admin_users query fails", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "someone@example.com" } },
      error: null,
    });
    adminQueryMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    expect(await getAdminUser()).toBeNull();
  });

  it("returns the admin user when present", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "owner@example.com" } },
      error: null,
    });
    adminQueryMock.mockResolvedValue({ data: { user_id: "u1" }, error: null });

    expect(await getAdminUser()).toEqual({
      id: "u1",
      email: "owner@example.com",
    });
  });
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("redirects to /admin/login when the user is not an admin", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith("/admin/login");
  });

  it("returns the admin user when authorized", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email: "owner@example.com" } },
      error: null,
    });
    adminQueryMock.mockResolvedValue({ data: { user_id: "u1" }, error: null });

    await expect(requireAdmin()).resolves.toEqual({
      id: "u1",
      email: "owner@example.com",
    });
    expect(redirectMock).not.toHaveBeenCalled();
  });
});