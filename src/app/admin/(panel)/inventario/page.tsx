import type { Metadata } from "next";
import { StockTable } from "@/components/admin/stock-table";
import { getInventoryRows } from "@/lib/admin/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inventario",
};

export default async function InventoryPage() {
  const rows = await getInventoryRows();
  const outOfStock = rows.filter((row) => row.stock === 0);
  const lowStock = rows.filter((row) => row.stock > 0 && row.stock <= 3);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventario</h1>
        <p className="text-sm text-[#71717a]">
          {rows.length} tallas · {outOfStock.length} agotadas · {lowStock.length}{" "}
          con stock bajo
        </p>
      </div>
      <StockTable rows={rows} />
    </div>
  );
}