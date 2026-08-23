import type { ReactNode } from "react";
import { formatPrice } from "@/lib/catalog/format";
import type { AnalyticsKpis } from "@/lib/analytics/types";

function Card({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#d4d4d8] bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#71717a]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#18181b]">
        {children}
      </p>
    </div>
  );
}

export function KpiCards({ kpis }: { kpis: AnalyticsKpis }) {
  const conversion = `${(kpis.conversionRate * 100).toFixed(1)}%`;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card label="Ingresos">{formatPrice(kpis.revenueCents)}</Card>
      <Card label="Pedidos">{kpis.paidOrders}</Card>
      <Card label="Ticket medio">{formatPrice(kpis.aovCents)}</Card>
      <Card label="Conversión">{conversion}</Card>
      <Card label="Desglose">
        <span className="text-base font-semibold text-[#18181b]">
          {kpis.paidOrders} paid
        </span>
        <span className="ml-1 text-base font-medium text-[#dc2626]">
          / {kpis.failedOrders} fallidos
        </span>
      </Card>
    </div>
  );
}
