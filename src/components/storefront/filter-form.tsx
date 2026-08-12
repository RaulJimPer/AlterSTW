"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { FormEvent } from "react";
import type { Category } from "@/lib/catalog/types";
import {
  centsToEuros,
  composeCatalogQuery,
  eurosToCents,
} from "@/lib/catalog/search-params";

function formString(value: FormDataEntryValue | null): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

export function FilterForm({
  categories,
  sizes,
  onApplied,
}: {
  categories: Category[];
  sizes: string[];
  onApplied?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const current = new URLSearchParams(params?.toString() ?? "");

  const activeCat = current.get("cat") ?? "";
  const activeTalla = current.get("talla") ?? "";
  const activeAv = current.get("av") ?? "todos";
  const min = current.get("min");
  const max = current.get("max");

  function update(patch: Record<string, string | undefined>) {
    onApplied?.();
    router.replace(`/productos${composeCatalogQuery(current, patch)}`);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const minCents = eurosToCents(formString(formData.get("min")));
    const maxCents = eurosToCents(formString(formData.get("max")));
    update({
      cat: formString(formData.get("cat")),
      talla: formString(formData.get("talla")),
      min: minCents === undefined ? undefined : String(minCents),
      max: maxCents === undefined ? undefined : String(maxCents),
      av: formString(formData.get("av")),
    });
  }

  const activeChips: { key: string; label: string }[] = [];
  if (activeCat) {
    const name = categories.find((category) => category.slug === activeCat)?.name;
    activeChips.push({ key: "cat", label: name ?? activeCat });
  }
  if (activeTalla) activeChips.push({ key: "talla", label: activeTalla });
  if (min !== null || max !== null) {
    activeChips.push({
      key: "precio",
      label: `Precio ${centsToEuros(min ?? "") || "0"}–${centsToEuros(max ?? "") || "∞"}`,
    });
  }
  if (activeAv !== "todos") {
    activeChips.push({
      key: "av",
      label: activeAv === "disponible" ? "Disponible" : "Últimas",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2" aria-label="Filtros activos">
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => update({ [chip.key]: undefined })}
              aria-label={`Quitar filtro ${chip.label}`}
              className="inline-flex items-center gap-1 border border-red bg-paper px-1.5 py-0.5 text-[0.625rem] font-bold uppercase tracking-widest text-red hover:bg-red hover:text-paper"
            >
              {chip.label} ✕
            </button>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow text-purple">Categoría</legend>
          <label className="flex items-center justify-between rounded-print border border-rule px-2 py-1.5 text-sm">
            <span>Todas</span>
            <input
              type="radio"
              name="cat"
              value=""
              defaultChecked={activeCat === ""}
              className="h-4 w-4 accent-red"
            />
          </label>
          {categories.map((category) => (
            <label
              key={category.id}
              className="flex items-center justify-between rounded-print border border-rule px-2 py-1.5 text-sm"
            >
              <span>{category.name}</span>
              <input
                type="radio"
                name="cat"
                value={category.slug}
                defaultChecked={activeCat === category.slug}
                className="h-4 w-4 accent-red"
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow text-purple">Talla</legend>
          <label className="flex items-center justify-between rounded-print border border-rule px-2 py-1.5 text-sm">
            <span>Todas</span>
            <input
              type="radio"
              name="talla"
              value=""
              defaultChecked={activeTalla === ""}
              className="h-4 w-4 accent-red"
            />
          </label>
          {sizes.map((size) => (
            <label
              key={size}
              className="flex items-center justify-between rounded-print border border-rule px-2 py-1.5 text-sm"
            >
              <span>{size}</span>
              <input
                type="radio"
                name="talla"
                value={size}
                defaultChecked={activeTalla === size}
                className="h-4 w-4 accent-red"
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow text-purple">Precio (€)</legend>
          <div className="flex items-center gap-2">
            <label className="flex-1">
              <span className="sr-only">Precio mínimo</span>
              <input
                type="number"
                name="min"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={centsToEuros(min ?? "")}
                placeholder="0,00"
                className="field tabular-nums"
              />
            </label>
            <span aria-hidden>–</span>
            <label className="flex-1">
              <span className="sr-only">Precio máximo</span>
              <input
                type="number"
                name="max"
                inputMode="decimal"
                step="0.01"
                min="0"
                defaultValue={centsToEuros(max ?? "")}
                placeholder="∞"
                className="field tabular-nums"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="eyebrow text-purple">Estado</legend>
          {(
            [
              ["todos", "Todos"],
              ["disponible", "Disponible"],
              ["ultimas", "Últimas unidades"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value}
              className="flex items-center justify-between rounded-print border border-rule px-2 py-1.5 text-sm"
            >
              <span>{label}</span>
              <input
                type="radio"
                name="av"
                value={value}
                defaultChecked={activeAv === value}
                className="h-4 w-4 accent-red"
              />
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-2">
          <button type="submit" className="btn-primary w-full">
            Aplicar
          </button>
          <Link href="/productos" className="btn-secondary w-full text-center">
            Limpiar
          </Link>
        </div>
      </form>
    </div>
  );
}
