"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice } from "@/lib/catalog/format";
import type { TopProduct } from "@/lib/analytics/types";

const REVENUE = "#2563eb";
const QTY = "#0d9488";

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[#71717a]">Sin ventas.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={[...data].reverse()}
          margin={{ top: 8, right: 16, bottom: 0, left: 8 }}
        >
          <CartesianGrid stroke="#e5e5e5" horizontal={false} />
          <XAxis xAxisId="rev" type="number" stroke="#d4d4d8" tick={{ fontSize: 11, fill: "#52525b" }} />
          <XAxis
            xAxisId="qty"
            type="number"
            orientation="top"
            stroke="#d4d4d8"
            tick={{ fontSize: 11, fill: "#52525b" }}
          />
          <YAxis
            yAxisId="rev"
            type="category"
            dataKey="name"
            width={120}
            stroke="#d4d4d8"
            tick={{ fontSize: 11, fill: "#52525b" }}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Ingresos"
                ? formatPrice(Number(value))
                : [`${value}`, name]
            }
            contentStyle={{
              fontSize: 12,
              fontFamily: "var(--font-space-grotesk)",
            }}
          />
          <Legend />
          <Bar
            yAxisId="rev"
            xAxisId="rev"
            dataKey="revenueCents"
            name="Ingresos"
            fill={REVENUE}
            radius={[0, 2, 2, 0]}
          />
          <Bar
            yAxisId="rev"
            xAxisId="qty"
            dataKey="qty"
            name="Unidades"
            fill={QTY}
            radius={[0, 2, 2, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
