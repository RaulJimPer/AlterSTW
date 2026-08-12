import type { Metadata } from "next";
import { Suspense } from "react";
import { EmptyState } from "@/components/storefront/empty-state";
import { FilterSidebar } from "@/components/storefront/filter-sidebar";
import { LoadMoreButton } from "@/components/storefront/load-more-button";
import { MobileFilterSheet } from "@/components/storefront/mobile-filter-sheet";
import { ProductCard } from "@/components/storefront/product-card";
import { SortSelect } from "@/components/storefront/sort-select";
import {
  getAvailableSizes,
  getCategories,
  getPublishedProducts,
} from "@/lib/catalog/queries";
import {
  parseCatalogFilters,
  type CatalogFilters,
  type SearchParamsRaw,
} from "@/lib/validation/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Explora el catálogo de AlterSTW y filtra por estilo, talla y precio.",
};

function loadMoreHref(filters: CatalogFilters, nextPage: number): string {
  const params = new URLSearchParams();
  if (filters.cat) params.set("cat", filters.cat);
  if (filters.talla) params.set("talla", filters.talla);
  if (filters.min !== undefined) params.set("min", String(filters.min));
  if (filters.max !== undefined) params.set("max", String(filters.max));
  if (filters.av !== "todos") params.set("av", filters.av);
  if (filters.sort !== "nuevos") params.set("sort", filters.sort);
  if (filters.q) params.set("q", filters.q);
  params.set("page", String(nextPage));
  return `/productos?${params.toString()}`;
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const raw = await searchParams;
  const filters = parseCatalogFilters(raw);
  const [categories, sizes, catalog] = await Promise.all([
    getCategories(),
    getAvailableSizes(),
    getPublishedProducts(filters),
  ]);

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Catálogo
          </h1>
          <Suspense fallback={null}>
            <SortSelect />
          </Suspense>
        </div>

        <div className="mt-6 flex gap-8">
          <Suspense
            fallback={<aside aria-hidden className="hidden w-64 shrink-0 lg:block" />}
          >
            <FilterSidebar categories={categories} sizes={sizes} />
          </Suspense>

          <div className="min-w-0 flex-1">
            <Suspense fallback={null}>
              <div className="mb-4 lg:hidden">
                <MobileFilterSheet categories={categories} sizes={sizes} />
              </div>
            </Suspense>

            {catalog.items.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <p className="mb-4 text-xs text-ink/60">
                  {catalog.total}{" "}
                  {catalog.total === 1 ? "producto" : "productos"}
                  {filters.q ? ` para “${filters.q}”` : ""}
                </p>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                  {catalog.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                <div className="mt-10 flex justify-center">
                  <LoadMoreButton
                    href={loadMoreHref(filters, filters.page + 1)}
                    hasMore={catalog.hasMore}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <noscript className="sr-only">
        <p>Este catálogo funciona sin JavaScript: usa los filtros y el botón Ver más.</p>
      </noscript>
    </>
  );
}