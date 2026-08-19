import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrderById } from "@/lib/admin/queries";
import { formatPrice } from "@/lib/catalog/format";
import {
  EMAIL_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  formatDate,
} from "@/lib/admin/labels";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  return { title: order === null ? "Pedido" : `Pedido #${order.id}` };
}

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getAdminOrderById(id);
  if (order === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#71717a]">
          <Link href="/admin/pedidos" className="hover:underline">
            Pedidos
          </Link>
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Pedido #{order.id}</h1>
          <span className="inline-block rounded-full bg-[#f4f4f5] px-2 py-0.5 text-xs font-semibold text-[#71717a]">
            {ORDER_STATUS_LABELS[order.status]}
          </span>
          <span
            className={
              order.emailStatus === "failed"
                ? "inline-block rounded-full bg-[#dc2626]/10 px-2 py-0.5 text-xs font-semibold text-[#dc2626]"
                : "inline-block rounded-full bg-[#f4f4f5] px-2 py-0.5 text-xs font-semibold text-[#71717a]"
            }
          >
            Email: {EMAIL_STATUS_LABELS[order.emailStatus]}
          </span>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border border-[#d4d4d8] bg-white p-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#71717a]">
            Cliente
          </p>
          <p className="mt-1 text-sm font-medium text-[#18181b]">
            {order.customerEmail ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#71717a]">
            Fecha
          </p>
          <p className="mt-1 text-sm font-medium text-[#18181b]">
            {formatDate(order.createdAt)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#71717a]">
            Referencia Stripe
          </p>
          <p className="mt-1 truncate text-sm font-medium text-[#18181b]">
            {order.checkoutSessionId}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[#d4d4d8] bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-[#d4d4d8] text-xs uppercase tracking-wide text-[#71717a]">
            <tr>
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="px-4 py-3 font-semibold">Talla</th>
              <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
              <th className="px-4 py-3 text-right font-semibold">Precio unitario</th>
              <th className="px-4 py-3 text-right font-semibold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr
                key={`${item.productSlug}-${item.size}`}
                className="border-b border-[#f4f4f5] last:border-b-0"
              >
                <td className="px-4 py-3 font-medium text-[#18181b]">
                  {item.productName}
                </td>
                <td className="px-4 py-3 text-[#52525b]">{item.size}</td>
                <td className="px-4 py-3 text-right tabular-nums">{item.qty}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPrice(item.unitPriceCents)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPrice(item.unitPriceCents * item.qty)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <div className="flex w-full max-w-xs flex-col gap-1 rounded-lg border border-[#d4d4d8] bg-white p-4 text-sm">
          <div className="flex justify-between text-[#52525b]">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatPrice(order.subtotalCents)}</span>
          </div>
          <div className="flex justify-between border-t border-[#f4f4f5] pt-2 font-bold text-[#18181b]">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(order.totalCents)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}