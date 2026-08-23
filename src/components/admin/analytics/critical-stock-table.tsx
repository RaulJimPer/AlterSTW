import Link from "next/link";
import type { InventoryRow } from "@/lib/admin/types";

export function CriticalStockTable({ rows }: { rows: InventoryRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#d4d4d8] bg-white p-10 text-center text-sm text-[#71717a]">
        No hay stock crítico.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-[#71717a]">
          {rows.length} tallas con stock ≤ 3
        </p>
        <Link
          href="/admin/inventario"
          className="text-sm font-semibold text-[#18181b] hover:underline"
        >
          Ver inventario →
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-[#d4d4d8] bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-[#d4d4d8] text-xs uppercase tracking-wide text-[#71717a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold">Talla</th>
              <th className="px-4 py-3 text-right font-semibold">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.productId}-${row.size}`}
                className="border-b border-[#f4f4f5] last:border-b-0"
              >
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
                <td
                  className={`px-4 py-3 text-right font-semibold tabular-nums ${
                    row.stock === 0 ? "text-[#dc2626]" : "text-[#d97706]"
                  }`}
                >
                  {row.stock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
