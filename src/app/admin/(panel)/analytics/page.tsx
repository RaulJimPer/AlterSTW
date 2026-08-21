import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RangeSelector } from "@/components/admin/analytics/range-selector";
import { KpiCards } from "@/components/admin/analytics/kpi-cards";
import { SalesChart } from "@/components/admin/analytics/sales-chart";
import { VisitsConversionChart } from "@/components/admin/analytics/visits-conversion-chart";
import { TopProductsChart } from "@/components/admin/analytics/top-products-chart";
import { CategoryDonut } from "@/components/admin/analytics/category-donut";
import { CriticalStockTable } from "@/components/admin/analytics/critical-stock-table";
import {
  getAnalyticsKpis,
  getCriticalStock,
  getSalesByCategory,
  getSalesSeries,
  getTopProducts,
} from "@/lib/analytics/queries";
import { parseAnalyticsRange, type SearchParamsRaw } from "@/lib/analytics/zod";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Estadísticas",
};

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#d4d4d8] bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#71717a]">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const raw = await searchParams;
  const range = parseAnalyticsRange(raw);

  const [kpis, series, topProducts, categories, criticalStock] = await Promise.all([
    getAnalyticsKpis(range),
    getSalesSeries(range),
    getTopProducts(range),
    getSalesByCategory(range),
    getCriticalStock(3),
  ]);

  const hasOrders = kpis.paidOrders > 0;
  const hasVisits = kpis.visits > 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estadísticas</h1>
          <p className="text-sm text-[#71717a]">
            Rendimiento del negocio en el rango seleccionado.
          </p>
        </div>
        <RangeSelector />
      </div>

      <KpiCards kpis={kpis} />

      {!hasOrders && !hasVisits ? (
        <p className="rounded-lg border border-dashed border-[#d4d4d8] bg-white p-10 text-center text-sm text-[#71717a]">
          No hay pedidos ni visitas en este rango.
        </p>
      ) : (
        <>
          {hasOrders ? (
            <ChartCard title="Ventas en el tiempo">
              <SalesChart data={series} />
            </ChartCard>
          ) : (
            <p className="text-sm text-[#71717a]">Aún no hay ventas en este rango.</p>
          )}

          {hasVisits ? (
            <ChartCard title="Visitas y conversión">
              <VisitsConversionChart data={series} />
            </ChartCard>
          ) : (
            <p className="text-sm text-[#71717a]">Aún no hay visitas en este rango.</p>
          )}

          {hasOrders ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ChartCard title="Top productos">
                <TopProductsChart data={topProducts} />
              </ChartCard>
              <ChartCard title="Ventas por categoría">
                <CategoryDonut data={categories} />
              </ChartCard>
            </div>
          ) : null}
        </>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-[#18181b]">
          Stock crítico
        </h2>
        <CriticalStockTable rows={criticalStock} />
      </section>
    </div>
  );
}
