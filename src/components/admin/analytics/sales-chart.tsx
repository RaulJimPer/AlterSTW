"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/catalog/format";
import type { SeriesPoint } from "@/lib/analytics/types";

const REVENUE = "#2563eb";
const ORDERS = "#0d9488";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function SalesChart({ data }: { data: SeriesPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[#71717a]">Sin datos de ventas.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="#e5e5e5" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDate}
            tick={{ fontSize: 11, fill: "#52525b" }}
            stroke="#d4d4d8"
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 11, fill: "#52525b" }}
            stroke="#d4d4d8"
            width={48}
          />
          <YAxis yAxisId="right" orientation="right" hide />
          <Tooltip
            formatter={(value, name) =>
              name === "Ingresos" ? formatPrice(Number(value)) : [`${value}`, name]
            }
            labelFormatter={(label) => fmtDate(String(label))}
            contentStyle={{
              fontSize: 12,
              fontFamily: "var(--font-space-grotesk)",
            }}
          />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="orders"
            name="Pedidos"
            fill={ORDERS}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="revenueCents"
            name="Ingresos"
            stroke={REVENUE}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
