"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Category } from "@/lib/catalog/types";
import {
  centsToEuros,
  composeCatalogQuery,
  eurosToCents,
} from "@/lib/catalog/search-params";

type GroupKey = "cat" | "talla" | "precio" | "estado";

const ALL_GROUPS_CLOSED: Record<GroupKey, boolean> = {
  cat: false,
  talla: false,
  precio: false,
  estado: false,
};

function formString(value: FormDataEntryValue | null): string | undefined {
  if (value === null || value === "") return undefined;
  return String(value);
}

function GroupHeader({
  label,
  open,
  controlId,
  onToggle,
}: {
  label: string;
  open: boolean;
  controlId: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controlId}
      onClick={onToggle}
      className="eyebrow flex w-full cursor-pointer items-center justify-between gap-2 text-purple"
    >
      <span>{label}</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
      >
        <path
          d="m5 8 5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
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
  const [openGroups, setOpenGroups] =
    useState<Record<GroupKey, boolean>>(ALL_GROUPS_CLOSED);

  const activeCat = current.get("cat") ?? "";
  const activeTalla = current.get("talla") ?? "";
  const activeAv = current.get("av") ?? "todos";
  const min = current.get("min");
  const max = current.get("max");

  function update(patch: Record<string, string | undefined>) {
    onApplied?.();
    router.replace(`/productos${composeCatalogQuery(current, patch)}`);
  }

  function toggleGroup(key: GroupKey) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
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

      <form
        key={current.toString()}
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {/* key={...} remonta el form al cambiar la URL: los valores por defecto
            se re-derivan del estado limpio sin tocar openGroups. */}
        <div className="flex flex-col gap-3">
          <GroupHeader
            label="Categoría"
            open={openGroups.cat}
            controlId="filter-panel-cat"
            onToggle={() => toggleGroup("cat")}
          />
          <div id="filter-panel-cat" hidden={!openGroups.cat}>
            <fieldset aria-label="Categoría" className="flex flex-col gap-2">
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
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <GroupHeader
            label="Talla"
            open={openGroups.talla}
            controlId="filter-panel-talla"
            onToggle={() => toggleGroup("talla")}
          />
          <div id="filter-panel-talla" hidden={!openGroups.talla}>
            <fieldset aria-label="Talla" className="flex flex-col gap-2">
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
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <GroupHeader
            label="Precio (€)"
            open={openGroups.precio}
            controlId="filter-panel-precio"
            onToggle={() => toggleGroup("precio")}
          />
          <div id="filter-panel-precio" hidden={!openGroups.precio}>
            <fieldset aria-label="Precio (€)" className="flex flex-col gap-2">
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
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <GroupHeader
            label="Estado"
            open={openGroups.estado}
            controlId="filter-panel-estado"
            onToggle={() => toggleGroup("estado")}
          />
          <div id="filter-panel-estado" hidden={!openGroups.estado}>
            <fieldset aria-label="Estado" className="flex flex-col gap-2">
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
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button type="submit" className="btn-primary w-full">
            Aplicar
          </button>
          <Link
            href="/productos"
            className="btn-secondary w-full text-center"
            onClick={() => setOpenGroups(ALL_GROUPS_CLOSED)}
          >
            Limpiar
          </Link>
        </div>
      </form>
    </div>
  );
}
