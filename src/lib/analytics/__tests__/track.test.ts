import { beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: createClientMock,
}));

import { trackPageVisitAction } from "@/lib/analytics/track";

function stubInsert(insert: ReturnType<typeof vi.fn>) {
  const from = vi.fn(() => ({ insert }));
  createClientMock.mockResolvedValue({ from });
  return { from };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("trackPageVisitAction", () => {
  it("inserts a valid path", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    stubInsert(insert);

    await trackPageVisitAction("/camisetas");

    expect(insert).toHaveBeenCalledWith({ path: "/camisetas" });
  });

  it("ignores invalid paths without calling the db", async () => {
    const insert = vi.fn();
    stubInsert(insert);

    await trackPageVisitAction("");
    await trackPageVisitAction("x".repeat(201));

    expect(insert).not.toHaveBeenCalled();
  });

  it("swallows insert errors (fire-and-forget)", async () => {
    const from = vi.fn(() => ({
      insert: vi.fn().mockRejectedValue(new Error("boom")),
    }));
    createClientMock.mockResolvedValue({ from });

    await expect(trackPageVisitAction("/x")).resolves.toBeUndefined();
  });
});
