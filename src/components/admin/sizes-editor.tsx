"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSizes } from "@/lib/admin/actions";
import { MAX_SIZES } from "@/lib/admin/zod";
import { SIZE_OPTIONS, SIZE_OTHER } from "@/lib/admin/labels";

type SizeRow = { size: string; stock: number; sortOrder: number };

const SIZE_VALUES = SIZE_OPTIONS as readonly string[];
const isKnownSize = (value: string) => SIZE_VALUES.includes(value);

export function SizesEditor({
  slug,
  sizes,
}: {
  slug: string;
  sizes: SizeRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SizeRow[]>(sizes);

  const patchRow = (index: number, patch: Partial<SizeRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { size: "", stock: 0, sortOrder: prev.length },
    ]);
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const result = await saveSizes(slug, rows);
      if (result.ok) {
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[#d4d4d8] bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">
          Tallas y stock
        </p>
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= MAX_SIZES}
          className="admin-btn"
        >
          Añadir talla
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-[#71717a]">
          Sin tallas. Añade al menos una para poder vender este producto.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-sm">
            <thead className="border-b border-[#d4d4d8] text-xs uppercase tracking-wide text-[#71717a]">
              <tr>
                <th className="px-3 py-2 font-semibold">Talla</th>
                <th className="px-3 py-2 font-semibold">Stock</th>
                <th className="px-3 py-2 text-right font-semibold">Quitar</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} className="border-b border-[#f4f4f5] last:border-b-0">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={isKnownSize(row.size) ? row.size : SIZE_OTHER}
                        onChange={(event) =>
                          patchRow(index, {
                            size:
                              event.target.value === SIZE_OTHER
                                ? row.size
                                : event.target.value,
                          })
                        }
                        className="admin-field min-w-28"
                      >
                        {SIZE_OPTIONS.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                        <option value={SIZE_OTHER}>{SIZE_OTHER}</option>
                      </select>
                      {!isKnownSize(row.size) && (
                        <input
                          value={row.size}
                          onChange={(event) =>
                            patchRow(index, { size: event.target.value })
                          }
                          maxLength={24}
                          placeholder="Otra talla…"
                          aria-label={`Otra talla (fila ${index + 1})`}
                          className="admin-field w-32"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      max={9999}
                      value={row.stock}
                      onChange={(event) =>
                        patchRow(index, { stock: Number(event.target.value) })
                      }
                      className="admin-field w-24"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      className="text-xs font-semibold text-[#dc2626] hover:underline"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
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

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="admin-btn-primary"
        >
          {pending ? "Guardando…" : "Guardar tallas"}
        </button>
      </div>
    </div>
  );
}