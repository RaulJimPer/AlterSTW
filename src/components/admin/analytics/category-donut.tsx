"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatPrice } from "@/lib/catalog/format";
import type { CategorySales } from "@/lib/analytics/types";

const PALETTE = ["#2563eb", "#0d9488", "#ea580c", "#7c3aed", "#d97706", "#0891b2"];

export function CategoryDonut({ data }: { data: CategorySales[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[#71717a]">Sin ventas.</p>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="revenueCents"
            nameKey="categoryName"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={1}
          >
            {data.map((entry) => (
              <Cell
                key={entry.categoryName}
                fill={PALETTE[data.indexOf(entry) % PALETTE.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatPrice(Number(value)), String(name)]}
            contentStyle={{
              fontSize: 12,
              fontFamily: "var(--font-space-grotesk)",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
