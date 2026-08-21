import { describe, expect, it } from "vitest";
import {
  parseAnalyticsRange,
  toDateRange,
  analyticsRangeSchema,
} from "@/lib/analytics/zod";
import type { SearchParamsRaw } from "@/lib/analytics/zod";

describe("parseAnalyticsRange", () => {
  it("defaults to 30d with a day granularity", () => {
    const range = parseAnalyticsRange({});
    expect(range.key).toBe("30d");
    expect(range.granularity).toBe("day");
    expect(range.from).not.toBeNull();
    expect(range.to).toBe(range.from ? addDays(range.from, 29) : range.to);
  });

  it("computes fixed ranges ending today", () => {
    const today = new Date();
    const todayIso = new Date(
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()),
    )
      .toISOString()
      .slice(0, 10);

    const seven = parseAnalyticsRange({ range: "7d" });
    expect(seven.granularity).toBe("day");
    expect(seven.to).toBe(todayIso);

    const ninety = parseAnalyticsRange({ range: "90d" });
    expect(ninety.granularity).toBe("week");
    expect(ninety.to).toBe(todayIso);
  });

  it("all has no lower bound and week granularity", () => {
    const all = parseAnalyticsRange({ range: "all" });
    expect(all.from).toBeNull();
    expect(all.granularity).toBe("week");
  });

  it("valid custom range uses day for <=30d and week for >30d", () => {
    const short = parseAnalyticsRange({
      range: "custom",
      from: "2026-01-01",
      to: "2026-01-20",
    });
    expect(short.granularity).toBe("day");

    const long = parseAnalyticsRange({
      range: "custom",
      from: "2026-01-01",
      to: "2026-03-15",
    });
    expect(long.granularity).toBe("week");
  });

  it("invalid custom range (missing/unordered dates) falls back to 30d", () => {
    const missing = parseAnalyticsRange({ range: "custom", from: "2026-01-01" });
    expect(missing.key).toBe("30d");

    const unordered = parseAnalyticsRange({
      range: "custom",
      from: "2026-02-01",
      to: "2026-01-01",
    });
    expect(unordered.key).toBe("30d");
  });

  it("ignores unknown range keys", () => {
    const unknown = parseAnalyticsRange({ range: "forever" } as SearchParamsRaw);
    expect(unknown.key).toBe("30d");
  });

  it("rejects malformed dates", () => {
    const bad = parseAnalyticsRange({
      range: "custom",
      from: "01/01/2026",
      to: "2026-12-31",
    });
    expect(bad.key).toBe("30d");
  });
});

describe("toDateRange", () => {
  it("returns the explicit range without recomputation", () => {
    const range = toDateRange("custom", "2026-01-01", "2026-01-10");
    expect(range.from).toBe("2026-01-01");
    expect(range.to).toBe("2026-01-10");
    expect(range.granularity).toBe("day");
  });
});

describe("analyticsRangeSchema", () => {
  it("parses a valid input", () => {
    const result = analyticsRangeSchema.safeParse({
      range: "30d",
      from: "2026-01-01",
    });
    expect(result.success).toBe(true);
  });
});

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}
