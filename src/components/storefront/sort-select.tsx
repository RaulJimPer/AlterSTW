"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { composeCatalogQuery } from "@/lib/catalog/search-params";

const OPTIONS = [
  ["nuevos", "Más reciente"],
  ["precio-asc", "Precio ↑"],
  ["precio-desc", "Precio ↓"],
] as const;

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname() ?? "/productos";
  const params = useSearchParams();
  const current = new URLSearchParams(params?.toString() ?? "");
  const value = current.get("sort") ?? "nuevos";

  function handleChange(sort: string) {
    router.replace(
      `${pathname}${composeCatalogQuery(current, { sort })}`,
    );
  }

  return (
    <label className="flex items-center gap-2">
      <span className="eyebrow text-ink">Ordenar</span>
      <select
        value={value}
        onChange={(event) => handleChange(event.target.value)}
        className="field w-auto"
      >
        {OPTIONS.map(([option, label]) => (
          <option key={option} value={option}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
