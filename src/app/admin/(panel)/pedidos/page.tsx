import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOrders } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/catalog/format";
import { EMAIL_STATUS_LABELS, formatDate } from "@/lib/admin/labels";
import {
  ADMIN_PAGE_SIZE,
  parseAdminOrderFilters,
  type AdminOrderFilters,
  type SearchParamsRaw,
} from "@/lib/admin/zod";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedidos",
};

export function orderListHref(
  filters: AdminOrderFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  if (filters.status !== undefined) params.set("status", filters.status);
  if (filters.emailStatus !== undefined) {
    params.set("emailStatus", filters.emailStatus);
  }
  params.set("page", String(page));
  return `/admin/pedidos?${params.toString()}`;
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
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
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParamsRaw>;
}) {
  const raw = await searchParams;
  const filters = parseAdminOrderFilters(raw);
  const page = await getAdminOrders(filters);
  const hasMore = filters.page * ADMIN_PAGE_SIZE < page.total;
  const hasActiveFilters =
    filters.status !== undefined || filters.emailStatus !== undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pedidos</h1>
        <p className="text-sm text-[#71717a]">
          {page.total} {page.total === 1 ? "pedido" : "pedidos"}
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-[#d4d4d8] bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[#a1a1aa]">
            Estado
          </span>
          <FilterLink
            href={orderListHref({ ...filters, status: undefined, page: 1 }, 1)}
            label="Todos"
            active={filters.status === undefined}
          />
          <FilterLink
            href={orderListHref({ ...filters, status: "paid", page: 1 }, 1)}
            label="Pagados"
            active={filters.status === "paid"}
          />
          <FilterLink
            href={orderListHref(
              { ...filters, status: "stock_failed", page: 1 },
              1,
            )}
            label="Sin stock"
            active={filters.status === "stock_failed"}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-[#a1a1aa]">
            Email
          </span>
          <FilterLink
            href={orderListHref(
              { ...filters, emailStatus: undefined, page: 1 },
              1,
            )}
            label="Todos"
            active={filters.emailStatus === undefined}
          />
          {(["pending", "sent", "failed"] as const).map((emailStatus) => (
            <FilterLink
              key={emailStatus}
              href={orderListHref(
                { ...filters, emailStatus, page: 1 },
                1,
              )}
              label={EMAIL_STATUS_LABELS[emailStatus]}
              active={filters.emailStatus === emailStatus}
            />
          ))}
        </div>
        {hasActiveFilters && (
          <div className="flex justify-end border-t border-[#f4f4f5] pt-3">
            <Link href="/admin/pedidos" className="admin-btn">
              Limpiar filtros
            </Link>
          </div>
        )}
      </div>

      {page.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#d4d4d8] bg-white p-10 text-center text-sm text-[#71717a]">
          No hay pedidos con estos filtros.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[#d4d4d8] bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[#d4d4d8] text-xs uppercase tracking-wide text-[#71717a]">
              <tr>
                <th className="px-4 py-3 font-semibold">Ref</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 text-right font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {page.items.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#f4f4f5] last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-semibold text-[#18181b] hover:underline"
                    >
                      #{order.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[#52525b]">
                    {order.customerEmail ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatPrice(order.totalCents)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-[#f4f4f5] px-2 py-0.5 text-xs font-semibold text-[#71717a]">
                      {order.status === "paid" ? "Pagado" : "Sin stock"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        order.emailStatus === "failed"
                          ? "text-xs font-semibold text-[#dc2626]"
                          : "text-xs text-[#52525b]"
                      }
                    >
                      {EMAIL_STATUS_LABELS[order.emailStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#52525b]">
                    {formatDate(order.createdAt)}
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
            href={orderListHref(filters, filters.page + 1)}
            className="admin-btn"
          >
            Ver más
          </Link>
        </div>
      )}
    </div>
  );
}