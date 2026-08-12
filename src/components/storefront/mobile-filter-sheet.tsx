"use client";

import { useState } from "react";
import type { Category } from "@/lib/catalog/types";
import { FilterForm } from "./filter-form";

export function MobileFilterSheet({
  categories,
  sizes,
}: {
  categories: Category[];
  sizes: string[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-secondary lg:hidden"
      >
        Filtros
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filtros"
          className="fixed inset-0 z-50 flex flex-col bg-paper lg:hidden"
        >
          <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
            <p className="eyebrow text-ink">Filtros</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              Cerrar
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <FilterForm
              categories={categories}
              sizes={sizes}
              onApplied={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
