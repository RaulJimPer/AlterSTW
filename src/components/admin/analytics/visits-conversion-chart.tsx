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
import type { SeriesPoint } from "@/lib/analytics/types";

const VISITS = "#ea580c";
const CONVERSION = "#7c3aed";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function VisitsConversionChart({ data }: { data: SeriesPoint[] }) {
  const points = data.map((point) => ({
    date: point.date,
    visits: point.visits,
    conversion: point.visits ? point.orders / point.visits : 0,
  }));

  if (points.length === 0) {
    return <p className="text-sm text-[#71717a]">Sin datos de visitas.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={points}
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
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(value) => `${(Number(value) * 100).toFixed(0)}%`}
            tick={{ fontSize: 11, fill: "#52525b" }}
            stroke="#d4d4d8"
            width={48}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "Conversión"
                ? `${(Number(value) * 100).toFixed(1)}%`
                : [`${value}`, name]
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
            dataKey="visits"
            name="Visitas"
            fill={VISITS}
            radius={[2, 2, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="conversion"
            name="Conversión"
            stroke={CONVERSION}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
