import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClearCartOnce } from "@/components/storefront/checkout/clear-cart-once";
import { StampBadge } from "@/components/storefront/stamp-badge";
import { formatPrice } from "@/lib/catalog/format";
import { getOrderByCheckoutSessionId } from "@/lib/orders/queries";
import type { OrderSummary } from "@/lib/orders/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pedido confirmado",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { session_id } = await searchParams;
  const checkoutSessionId = Array.isArray(session_id) ? session_id[0] : session_id;

  if (!checkoutSessionId) {
    redirect("/");
  }

  let order: OrderSummary | null = null;
  try {
    order = await getOrderByCheckoutSessionId(checkoutSessionId);
  } catch {
    order = null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {order === null ? (
        <ConfirmingState />
      ) : order.status === "stock_failed" ? (
        <StockFailedState />
      ) : (
        <OrderConfirmed order={order} />
      )}
    </div>
  );
}

function ConfirmingState() {
  return (
    <div className="tilework-on-paper flex flex-col items-center gap-4 rounded-print border border-rule bg-paper px-6 py-16 text-center">
      <StampBadge variant="vintage" label="EN LA IMPRENTA" />
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
        Estamos confirmando tu pedido
      </h1>
      <p className="max-w-md text-sm leading-relaxed">
        El pago se ha recibido. En unos segundos tendrás tu confirmación aquí;
        también te enviaremos el resumen por email.
      </p>
      <Link href="/productos" className="btn-secondary">
        Seguir explorando
      </Link>
    </div>
  );
}

function StockFailedState() {
  return (
    <div className="tilework-on-paper flex flex-col items-center gap-4 rounded-print border border-rule bg-paper px-6 py-16 text-center">
      <StampBadge variant="agotado" label="SIN SUERTE" />
      <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
        Se acabó antes de lo esperado
      </h1>
      <p className="max-w-md text-sm leading-relaxed">
        Algún artículo de tu pedido se agotó mientras pagabas. No te hemos
        cobrado nada fuera de lo común: escríbenos a hola@alterstw.com y te
        devolvemos el importe enseguida.
      </p>
      <Link href="/productos" className="btn-primary">
        Volver al catálogo
      </Link>
    </div>
  );
}

function OrderConfirmed({ order }: { order: OrderSummary }) {
  const created = new Date(order.createdAt);

  return (
    <div className="flex flex-col gap-6">
      <ClearCartOnce />
      <div className="border-2 border-ink bg-paper">
        <div className="border-b-2 border-ink bg-void px-6 py-4">
          <p className="eyebrow text-yellow">PEDIDO CONFIRMADO</p>
          <p className="font-display text-2xl font-extrabold uppercase tracking-tight text-paper">
            ¡Lo tenemos!
          </p>
        </div>
        <div className="flex flex-col gap-6 px-6 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-ink/60">
                Pedido nº {order.id}
              </p>
              <p className="text-sm text-ink/70">
                {created.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
                {" · "}
                {created.toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                h
              </p>
            </div>
            <StampBadge variant="nuevo" label="PAGADO" />
          </div>

          <ul className="flex flex-col">
            {order.items.map((item) => (
              <li
                key={`${item.productSlug}-${item.size}`}
                className="flex items-center justify-between gap-3 border-b border-rule py-3 last:border-b-0"
              >
                <div>
                  <p className="font-display text-sm font-bold uppercase leading-tight">
                    {item.productName}
                  </p>
                  <p className="text-xs text-ink/60">
                    Talla {item.size} · {item.qty}
                    {item.qty > 1 ? " uds." : " unidad"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ink/60">
                    {formatPrice(item.unitPriceCents)} cada una
                  </p>
                  <p className="font-display text-sm font-bold tabular-nums">
                    {formatPrice(item.unitPriceCents * item.qty)}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-1 border-t-2 border-ink pt-4">
            <div className="flex items-center justify-between">
              <p className="eyebrow text-ink">Subtotal</p>
              <p className="font-display font-bold tabular-nums">
                {formatPrice(order.subtotalCents)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="eyebrow text-red">Total pagado</p>
              <p className="font-display text-xl font-extrabold tabular-nums text-red">
                {formatPrice(order.totalCents)}
              </p>
            </div>
            <p className="mt-1 text-xs text-ink/60">
              Envío por confirmar en un email aparte. No incluye envío.
            </p>
          </div>

          {order.customerEmail !== null && (
            <p className="text-sm text-ink/70">
              Te hemos enviado la confirmación a{" "}
              <span className="font-semibold">{order.customerEmail}</span>.
            </p>
          )}

          <Link href="/productos" className="btn-secondary">
            Seguir explorando
          </Link>
        </div>
      </div>
    </div>
  );
}