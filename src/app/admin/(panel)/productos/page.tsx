import type { Metadata } from "next";
import Link from "next/link";
import { ProductStatusAction } from "@/components/admin/product-status-action";
import { getAdminProducts } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/catalog/format";
import { getCategories } from "@/lib/catalog/queries";
import { formatDate, PRODUCT_STATUS_LABELS } from "@/lib/admin/labels";
import {
  ADMIN_PAGE_SIZE,
  parseAdminProductFilters,
  type AdminProductFilters,
  type SearchParamsRaw,
} from "@/lib/admin/zod";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Productos",
};

export function productListHref(
  filters: AdminProductFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.status !== undefined) params.set("status", filters.status);
  if (filters.categoryId !== undefined) {
    params.set("categoryId", filters.categoryId);
  }
  if (filters.q !== undefined) params.set("q", filters.q);
  params.set("page", String(page));
  return `/admin/productos?${params.toString()}`;
}

function StatusPill({ published }: { published: boolean }) {
  return (
    <span
      className={
        published
          ? "inline-block rounded-full bg-[#18181b] px-2 py-0.5 text-xs font-semibold text-white"
          : "inline-block rounded-full bg-[#f4f4f5] px-2 py-0.5 text-xs font-semibold text-[#71717a]"
      }
    >
      {published ? PRODUCT_STATUS_LABELS.published : PRODUCT_STATUS_LABELS.draft}
    </span>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const raw = await searchParams;
  const filters = parseAdminProductFilters(raw);
  const [page, categories] = await Promise.all([
    getAdminProducts(filters),
    getCategories(),
  ]);
  const hasMore = filters.page * ADMIN_PAGE_SIZE < page.total;
  const hasActiveFilters =
    filters.status !== undefined ||
    filters.categoryId !== undefined ||
    filters.q !== undefined;

  const statusLink = (status: AdminProductFilters["status"], label: string) => {
    const active = filters.status === status;
    return (
      <Link
        href={productListHref({ ...filters, status, page: 1 }, 1)}
        aria-current={active ? "page" : undefined}
        className={
          active
            ? "rounded bg-[#18181b] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white"
            : "rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#52525b] hover:bg-[#f4f4f5]"
        }
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-sm text-[#71717a]">
            {page.total} {page.total === 1 ? "producto" : "productos"}
          </p>
        </div>
        <Link href="/admin/productos/nuevo" className="admin-btn-primary">
          Nuevo producto
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border border-[#d4d4d8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {statusLink(undefined, "Todos")}
          {statusLink("draft", "Borradores")}
          {statusLink("published", "Publicados")}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[#a1a1aa]">
              Categoría
            </span>
            {categories.map((category) => {
              const active = filters.categoryId === category.id;
              return (
                <Link
                  key={category.id}
                  href={productListHref(
                    { ...filters, categoryId: category.id, page: 1 },
                    1,
                  )}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "rounded bg-[#18181b] px-3 py-1.5 text-xs font-semibold text-white"
                      : "rounded px-3 py-1.5 text-xs font-semibold text-[#52525b] hover:bg-[#f4f4f5]"
                  }
                >
                  {category.name}
                </Link>
              );
            })}
          </div>
        )}

        <form action="/admin/productos" className="flex flex-wrap gap-2">
          {filters.status !== undefined && (
            <input type="hidden" name="status" value={filters.status} />
          )}
          {filters.categoryId !== undefined && (
            <input type="hidden" name="categoryId" value={filters.categoryId} />
          )}
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Buscar por nombre…"
            className="admin-field max-w-xs"
          />
          <button type="submit" className="admin-btn">
            Buscar
          </button>
        </form>
        {hasActiveFilters && (
          <div className="flex justify-end border-t border-[#f4f4f5] pt-3">
            <Link href="/admin/productos" className="admin-btn">
              Limpiar filtros
            </Link>
          </div>
        )}
      </div>

      {page.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#d4d4d8] bg-white p-10 text-center text-sm text-[#71717a]">
          No hay productos con estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#d4d4d8] bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#d4d4d8] text-xs uppercase tracking-wide text-[#71717a]">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 text-right font-semibold">Precio</th>
                <th className="px-4 py-3 text-right font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Modificado</th>
                <th className="px-4 py-3 text-right font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-[#f4f4f5] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/productos/${product.slug}/editar`}
                      className="font-semibold text-[#18181b] hover:underline"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-[#a1a1aa]">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[#52525b]">
                    {product.categoryName}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPrice(product.priceCents)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {product.stockTotal}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      published={product.status === "published"}
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-[#52525b]">
                    {formatDate(product.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/productos/${product.slug}/editar`}
                        className="admin-btn"
                      >
                        Editar
                      </Link>
                      <ProductStatusAction
                        slug={product.slug}
                        published={product.status === "published"}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Link
            href={productListHref(filters, filters.page + 1)}
            className="admin-btn"
          >
            Ver más
          </Link>
        </div>
      )}
    </div>
  );
}