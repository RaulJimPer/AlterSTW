import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computeBadge, NUEVO_WINDOW_DAYS } from "@/lib/catalog/availability";

describe("computeBadge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("marks stock 0 as agotado regardless of publication date", () => {
    expect(computeBadge(0, new Date().toISOString())).toBe("agotado");
    expect(computeBadge(0, null)).toBe("agotado");
  });

  it("marks fresh releases as nuevo within the window", () => {
    const fresh = new Date(Date.now() - 1000).toISOString();
    expect(computeBadge(5, fresh)).toBe("nuevo");
  });

  it("marks low stock as ultimas outside the new window", () => {
    const old = new Date(
      Date.now() - (NUEVO_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(computeBadge(1, old)).toBe("ultimas");
    expect(computeBadge(3, old)).toBe("ultimas");
  });

  it("returns null for healthy stock outside the window", () => {
    const old = new Date(
      Date.now() - (NUEVO_WINDOW_DAYS + 1) * 24 * 60 * 60 * 1000,
    ).toISOString();
    expect(computeBadge(24, old)).toBeNull();
  });

  it("falls back to ultimas when the date is missing or malformed", () => {
    expect(computeBadge(2, null)).toBe("ultimas");
    expect(computeBadge(2, "not-a-date")).toBe("ultimas");
    expect(computeBadge(12, null)).toBeNull();
  });
});