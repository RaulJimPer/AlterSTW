import { z } from "zod";
import type {
  AnalyticsGranularity,
  AnalyticsRange,
  AnalyticsRangeKey,
} from "./types";

const rangeOptions = ["7d", "30d", "90d", "all", "custom"] as const;
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOrUndefined(
  schema: z.ZodType<string>,
  value: string | string[] | undefined,
): string | undefined {
  const item = first(value);
  if (item === undefined) return undefined;
  const result = schema.safeParse(item);
  return result.success ? result.data : undefined;
}

function pickOption<const T extends readonly string[]>(
  value: string | string[] | undefined,
  options: T,
): T[number] | undefined {
  const item = first(value);
  if (item === undefined) return undefined;
  return options.includes(item as T[number]) ? (item as T[number]) : undefined;
}

function todayIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
    .toISOString()
    .slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function diffDaysIso(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(Date.UTC(ay, am - 1, ad)).getTime();
  const db = new Date(Date.UTC(by, bm - 1, bd)).getTime();
  return Math.round((db - da) / 86_400_000);
}

function granularityForSpan(from: string, to: string): AnalyticsGranularity {
  return diffDaysIso(from, to) > 30 ? "week" : "day";
}

export const analyticsRangeSchema = z.object({
  range: z.enum(rangeOptions).default("30d"),
  from: isoDate.optional(),
  to: isoDate.optional(),
});
export type AnalyticsRangeInput = z.infer<typeof analyticsRangeSchema>;

export type SearchParamsRaw = Record<string, string | string[] | undefined>;

function defaultRange(key: AnalyticsRangeKey = "30d"): AnalyticsRange {
  if (key === "all") {
    return { key, from: null, to: todayIso(), granularity: "week" };
  }
  const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
  const to = todayIso();
  const from = addDaysIso(to, -(days - 1));
  return { key, from, to, granularity: granularityForSpan(from, to) };
}

export function toDateRange(
  key: AnalyticsRangeKey,
  from?: string,
  to?: string,
): AnalyticsRange {
  if (key === "all") return defaultRange("all");

  if (key === "custom") {
    if (!from || !to || from > to) return defaultRange("30d");
    return { key, from, to, granularity: granularityForSpan(from, to) };
  }

  return defaultRange(key);
}

export function parseAnalyticsRange(raw: SearchParamsRaw): AnalyticsRange {
  const key = (pickOption(raw.range, rangeOptions) ?? "30d") as AnalyticsRangeKey;
  const from = parseOrUndefined(isoDate, raw.from);
  const to = parseOrUndefined(isoDate, raw.to);
  return toDateRange(key, from, to);
}
