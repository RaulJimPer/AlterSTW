export type AnalyticsGranularity = "day" | "week";

export type AnalyticsRangeKey = "7d" | "30d" | "90d" | "all" | "custom";

export type AnalyticsRange = {
  key: AnalyticsRangeKey;
  from: string | null; // ISO date (YYYY-MM-DD); null => sin cota inferior ("all")
  to: string; // ISO date (YYYY-MM-DD); "all" => hoy
  granularity: AnalyticsGranularity;
};

export type AnalyticsKpis = {
  revenueCents: number;
  paidOrders: number;
  aovCents: number; // 0 when paidOrders === 0
  conversionRate: number; // 0 when visits === 0
  failedOrders: number;
  visits: number;
};

export type SeriesPoint = {
  date: string; // ISO date (day) or ISO week start (YYYY-MM-DD)
  revenueCents: number;
  orders: number; // paid orders in the bucket
  visits: number;
};

export type TopProduct = {
  slug: string;
  name: string;
  qty: number;
  revenueCents: number;
};

export type CategorySales = {
  categoryName: string;
  revenueCents: number;
};
