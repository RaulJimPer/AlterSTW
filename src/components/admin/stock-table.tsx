"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { setStock } from "@/lib/admin/actions";
import type { InventoryRow } from "@/lib/admin/types";

function StockRow({
  row,
  disabled,
  onSave,
}: {
  row: InventoryRow;
  disabled: boolean;
  onSave: (row: InventoryRow, stock: number) => void;
}) {
  const [value, setValue] = useState(row.stock);
  const saved = value === row.stock;

  return (
    <tr className="border-b border-[#f4f4f5] last:border-b-0">
      <td className="px-4 py-3">
        <Link
          href={`/admin/productos/${row.productSlug}/editar`}
          className="font-semibold text-[#18181b] hover:underline"
        >
          {row.productName}
        </Link>
      </td>
      <td className="px-4 py-3 text-[#52525b]">{row.categoryName}</td>
      <td className="px-4 py-3 font-medium">{row.size}</td>
      <td className="px-4 py-3">
        <input
          type="number"
          min={0}
          max={9999}
          value={value}
          onChange={(event) => setValue(Number(event.target.value))}
          className="admin-field w-24"
        />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          onClick={() => onSave(row, value)}
          disabled={disabled || saved}
          className={saved ? "admin-btn opacity-40" : "admin-btn"}
        >
          {disabled ? "Guardando…" : saved ? "Guardado" : "Guardar"}
        </button>
      </td>
    </tr>
  );
}

export function StockTable({ rows }: { rows: InventoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = (row: InventoryRow, stock: number) => {
    setError(null);
    startTransition(async () => {
      const result = await setStock({
        productId: row.productId,
        size: row.size,
        stock,
      });
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#d4d4d8] bg-white p-10 text-center text-sm text-[#71717a]">
          No hay tallas registradas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#d4d4d8] bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-[#d4d4d8] text-xs uppercase tracking-wide text-[#71717a]">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Talla</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 text-right font-semibold">Guardar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <StockRow
                  key={`${row.productId}-${row.size}`}
                  row={row}
                  disabled={pending}
                  onSave={handleSave}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error !== null && (
        <p role="alert" className="text-sm text-[#dc2626]">
          {error}
        </p>
      )}
    </div>
  );
}