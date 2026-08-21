import { createClient } from "@/lib/supabase/server";
import { getInventoryRows } from "@/lib/admin/queries";
import type { InventoryRow } from "@/lib/admin/types";
import type {
  AnalyticsKpis,
  AnalyticsRange,
  CategorySales,
  SeriesPoint,
  TopProduct,
} from "./types";

type SeriesAgg = { revenue: number; orders: number; visits: number };

function weekStartIso(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // Monday = 0
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function zeroAgg(): SeriesAgg {
  return { revenue: 0, orders: 0, visits: 0 };
}

export async function getAnalyticsKpis(
  range: AnalyticsRange,
): Promise<AnalyticsKpis> {
  const db = await createClient();

  let salesQuery = db
    .from("sales_daily_v")
    .select("paid_orders, failed_orders, revenue_cents");
  if (range.from) salesQuery = salesQuery.gte("day", range.from);
  salesQuery = salesQuery.lte("day", range.to);
  const { data: sales, error: salesError } = await salesQuery;
  if (salesError) {
    throw new Error(`Failed to load analytics sales: ${salesError.message}`);
  }

  let visitsQuery = db.from("visits_daily_v").select("visits");
  if (range.from) visitsQuery = visitsQuery.gte("day", range.from);
  visitsQuery = visitsQuery.lte("day", range.to);
  const { data: visits, error: visitsError } = await visitsQuery;
  if (visitsError) {
    throw new Error(`Failed to load analytics visits: ${visitsError.message}`);
  }

  const paidOrders = (sales ?? []).reduce(
    (sum, r) => sum + Number(r.paid_orders),
    0,
  );
  const failedOrders = (sales ?? []).reduce(
    (sum, r) => sum + Number(r.failed_orders),
    0,
  );
  const revenueCents = (sales ?? []).reduce(
    (sum, r) => sum + Number(r.revenue_cents),
    0,
  );
  const visitsTotal = (visits ?? []).reduce((sum, r) => sum + Number(r.visits), 0);

  const aovCents = paidOrders ? Math.round(revenueCents / paidOrders) : 0;
  const conversionRate = visitsTotal ? paidOrders / visitsTotal : 0;

  return {
    revenueCents,
    paidOrders,
    aovCents,
    conversionRate,
    failedOrders,
    visits: visitsTotal,
  };
}

async function minDay(db: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const { data: s } = await db
    .from("sales_daily_v")
    .select("day")
    .order("day", { ascending: true })
    .limit(1);
  const { data: v } = await db
    .from("visits_daily_v")
    .select("day")
    .order("day", { ascending: true })
    .limit(1);
  const candidates = [s?.[0]?.day, v?.[0]?.day].filter(Boolean) as string[];
  return candidates.length ? candidates.reduce((a, b) => (a < b ? a : b)) : "";
}

function buildDailySeries(
  byDay: Map<string, SeriesAgg>,
  from: string,
  to: string,
): SeriesPoint[] {
  const points: SeriesPoint[] = [];
  let cur = from;
  while (cur <= to) {
    const agg = byDay.get(cur) ?? zeroAgg();
    points.push({
      date: cur,
      revenueCents: agg.revenue,
      orders: agg.orders,
      visits: agg.visits,
    });
    cur = addDaysIso(cur, 1);
  }
  return points;
}

function buildWeeklySeries(
  byDay: Map<string, SeriesAgg>,
  fromWeek: string,
  toWeek: string,
): SeriesPoint[] {
  const weekly = new Map<string, SeriesAgg>();
  for (const [day, agg] of byDay) {
    const wk = weekStartIso(day);
    const cur = weekly.get(wk) ?? zeroAgg();
    cur.revenue += agg.revenue;
    cur.orders += agg.orders;
    cur.visits += agg.visits;
    weekly.set(wk, cur);
  }
  const points: SeriesPoint[] = [];
  let cur = fromWeek;
  while (cur <= toWeek) {
    const agg = weekly.get(cur) ?? zeroAgg();
    points.push({
      date: cur,
      revenueCents: agg.revenue,
      orders: agg.orders,
      visits: agg.visits,
    });
    cur = addDaysIso(cur, 7);
  }
  return points;
}

export async function getSalesSeries(
  range: AnalyticsRange,
): Promise<SeriesPoint[]> {
  const db = await createClient();
  const from = range.from ?? (await minDay(db));
  if (!from) return [];
  const to = range.to;

  let salesQuery = db
    .from("sales_daily_v")
    .select("day, paid_orders, revenue_cents");
  if (range.from) salesQuery = salesQuery.gte("day", range.from);
  salesQuery = salesQuery.lte("day", to);
  const { data: salesRows, error } = await salesQuery;
  if (error) {
    throw new Error(`Failed to load sales series: ${error.message}`);
  }

  let visitsQuery = db.from("visits_daily_v").select("day, visits");
  if (range.from) visitsQuery = visitsQuery.gte("day", range.from);
  visitsQuery = visitsQuery.lte("day", to);
  const { data: visitRows, error: vErr } = await visitsQuery;
  if (vErr) {
    throw new Error(`Failed to load visits series: ${vErr.message}`);
  }

  const byDay = new Map<string, SeriesAgg>();
  for (const r of (salesRows ?? []) as Array<{
    day: string;
    paid_orders: number;
    revenue_cents: number;
  }>) {
    const cur = byDay.get(r.day) ?? zeroAgg();
    cur.revenue += Number(r.revenue_cents);
    cur.orders += Number(r.paid_orders);
    byDay.set(r.day, cur);
  }
  for (const r of (visitRows ?? []) as Array<{ day: string; visits: number }>) {
    const cur = byDay.get(r.day) ?? zeroAgg();
    cur.visits += Number(r.visits);
    byDay.set(r.day, cur);
  }

  if (range.granularity === "week") {
    return buildWeeklySeries(byDay, weekStartIso(from), weekStartIso(to));
  }
  return buildDailySeries(byDay, from, to);
}

export async function getTopProducts(
  range: AnalyticsRange,
  limit = 5,
): Promise<TopProduct[]> {
  const db = await createClient();
  let query = db
    .from("order_items")
    .select("product_slug, product_name, qty, unit_price_cents, orders!inner(created_at)");
  if (range.from) query = query.gte("orders.created_at", range.from);
  query = query.lte("orders.created_at", range.to);
  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load top products: ${error.message}`);
  }

  const map = new Map<string, TopProduct>();
  for (const r of (data ?? []) as Array<{
    product_slug: string;
    product_name: string;
    qty: number;
    unit_price_cents: number;
  }>) {
    const slug = r.product_slug;
    const cur =
      map.get(slug) ?? { slug, name: r.product_name, qty: 0, revenueCents: 0 };
    cur.qty += Number(r.qty);
    cur.revenueCents += Number(r.qty) * Number(r.unit_price_cents);
    map.set(slug, cur);
  }

  return [...map.values()]
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
}

export async function getSalesByCategory(
  range: AnalyticsRange,
): Promise<CategorySales[]> {
  const db = await createClient();
  const { data: products, error: catErr } = await db
    .from("products")
    .select("slug, categories(name)");
  if (catErr) {
    throw new Error(`Failed to load category map: ${catErr.message}`);
  }

  const slugToCategory = new Map<string, string>();
  const productRows = (products ?? []) as unknown as Array<{
    slug: string;
    categories: { name: string } | null;
  }>;
  for (const p of productRows) {
    slugToCategory.set(p.slug, p.categories?.name ?? "—");
  }

  let itemsQuery = db
    .from("order_items")
    .select("product_slug, qty, unit_price_cents, orders!inner(created_at)");
  if (range.from) itemsQuery = itemsQuery.gte("orders.created_at", range.from);
  itemsQuery = itemsQuery.lte("orders.created_at", range.to);
  const { data, error } = await itemsQuery;
  if (error) {
    throw new Error(`Failed to load sales by category: ${error.message}`);
  }

  const byCategory = new Map<string, number>();
  for (const r of (data ?? []) as Array<{
    product_slug: string;
    qty: number;
    unit_price_cents: number;
  }>) {
    const category = slugToCategory.get(r.product_slug) ?? "—";
    const revenue = Number(r.qty) * Number(r.unit_price_cents);
    byCategory.set(category, (byCategory.get(category) ?? 0) + revenue);
  }

  return [...byCategory.entries()]
    .map(([categoryName, revenueCents]) => ({ categoryName, revenueCents }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

export async function getCriticalStock(
  threshold = 3,
): Promise<InventoryRow[]> {
  const rows = await getInventoryRows();
  return rows.filter((row) => row.stock <= threshold);
}
