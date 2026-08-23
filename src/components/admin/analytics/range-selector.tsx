"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const PRESETS = [
  { key: "7d", label: "7 días" },
  { key: "30d", label: "30 días" },
  { key: "90d", label: "90 días" },
  { key: "all", label: "Todo" },
];

export function RangeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("range") ?? "30d";
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  const push = (params: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/admin/analytics?${next.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => push({ range: preset.key, from: "", to: "" })}
            aria-pressed={current === preset.key}
            className={
              current === preset.key ? "admin-btn-primary" : "admin-btn"
            }
          >
            {preset.label}
          </button>
        ))}
      </div>
      <form
        className="flex items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          push({ range: "custom", from, to });
        }}
      >
        <label className="flex flex-col gap-1 text-xs font-medium text-[#52525b]">
          Desde
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="admin-field w-auto"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-[#52525b]">
          Hasta
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="admin-field w-auto"
          />
        </label>
        <button type="submit" className="admin-btn-primary">
          Aplicar
        </button>
      </form>
    </div>
  );
}
