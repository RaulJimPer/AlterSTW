"use client";

import { useState } from "react";

export type SizeOption = { size: string; stock: number; available: boolean };

export function SizeChips({
  sizes,
  selected,
  onSelect,
}: {
  sizes: SizeOption[];
  selected?: string | null;
  onSelect?: (size: string) => void;
}) {
  const [internal, setInternal] = useState<string | null>(null);
  const current = selected !== undefined ? selected : internal;
  const handleSelect = (size: string) => {
    if (selected !== undefined) onSelect?.(size);
    else setInternal(size);
  };

  return (
    <div role="group" aria-label="Tallas" className="flex flex-wrap gap-2">
      {sizes.length === 0 && (
        <p className="text-sm text-ink/60">Este producto no tiene tallas.</p>
      )}
      {sizes.map((item) => (
        <button
          key={item.size}
          type="button"
          disabled={!item.available}
          aria-pressed={current === item.size}
          title={item.available ? `${item.stock} unidades` : "Agotado"}
          onClick={() => handleSelect(item.size)}
          className={`inline-flex min-h-11 min-w-11 items-center justify-center border-2 px-3 py-1 font-display text-sm font-bold tabular-nums transition-colors ${
            current === item.size
              ? "border-red bg-red text-paper"
              : "border-rule bg-paper text-ink hover:border-red"
          } ${!item.available ? "cursor-not-allowed border-rule text-ink/40 line-through" : ""}`}
        >
          {item.size}
          {!item.available && <span className="sr-only">(agotado)</span>}
        </button>
      ))}
    </div>
  );
}