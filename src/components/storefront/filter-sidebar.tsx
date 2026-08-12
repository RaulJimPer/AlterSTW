import type { Category } from "@/lib/catalog/types";
import { FilterForm } from "./filter-form";

export function FilterSidebar({
  categories,
  sizes,
}: {
  categories: Category[];
  sizes: string[];
}) {
  return (
    <aside
      aria-label="Filtros"
      className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-64 shrink-0 overflow-y-auto border-r border-rule pr-4 lg:block"
    >
      <p className="eyebrow mb-4 text-ink">Filtrar</p>
      <FilterForm categories={categories} sizes={sizes} />
    </aside>
  );
}
