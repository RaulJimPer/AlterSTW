"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeLine, setQuantity } from "@/lib/cart/actions";
import { createCheckoutSession } from "@/lib/checkout/actions";
import { formatPrice } from "@/lib/catalog/format";
import type { CartLineItem, CartState } from "@/lib/cart/types";
import { StampBadge } from "../stamp-badge";

export function CartLines({ cart }: { cart: CartState }) {
  const router = useRouter();
  const [checkoutPending, startCheckoutTransition] = useTransition();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const checkout = () => {
    setCheckoutError(null);
    startCheckoutTransition(async () => {
      const result = await createCheckoutSession();
      if (result.ok) {
        router.push(result.url);
      } else {
        setCheckoutError(result.error);
      }
    });
  };

  if (cart.lines.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <StampBadge variant="vintage" label="NADA POR AQUÍ" />
        <p className="max-w-sm text-sm leading-relaxed">
          Tu carro está vacío. Echa un vistazo al catálogo.
        </p>
        <Link href="/productos" className="btn-secondary">
          Ir al catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-4">
        {cart.lines.map((line) => (
          <CartLineRow key={`${line.slug}-${line.size}`} line={line} />
        ))}
      </ul>

      <div className="border-t-2 border-ink pt-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow text-ink">Subtotal</p>
          <p className="font-display text-xl font-bold tabular-nums text-red">
            {formatPrice(cart.subtotalCents)}
          </p>
        </div>
        <p className="mt-1 text-xs text-ink/60">Sin incluir envío.</p>

        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            disabled={!cart.valid || checkoutPending}
            onClick={checkout}
            className="btn-primary w-full disabled:opacity-50"
          >
            {checkoutPending ? "Abriendo pago…" : "Finalizar compra"}
          </button>
          <p role="status" aria-live="polite" className="text-xs text-ink/60">
            {checkoutError
              ? checkoutError
              : cart.valid
                ? "Pago seguro con Stripe · Sin incluir envío."
                : "Ajusta la cantidad de cada talla al stock disponible."}
          </p>
        </div>
      </div>
    </div>
  );
}

function CartLineRow({ line }: { line: CartLineItem }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const changeQty = (qty: number) => {
    startTransition(async () => {
      await setQuantity({ slug: line.slug, size: line.size, qty });
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      await removeLine({ slug: line.slug, size: line.size });
      router.refresh();
    });
  };

  const unitPrice = line.priceCents !== null ? formatPrice(line.priceCents) : "—";
  const lineTotal =
    line.available && line.priceCents !== null
      ? formatPrice(line.priceCents * line.qty)
      : "—";

  return (
    <li className="flex gap-3">
      <Link
        href={`/productos/${line.slug}`}
        className="block h-20 w-16 shrink-0 overflow-hidden rounded-print border border-rule"
      >
        <Image
          src={line.image}
          alt={line.name}
          width={64}
          height={80}
          className="h-full w-full object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/productos/${line.slug}`}
              className="block font-display text-sm font-bold uppercase leading-tight hover:text-red"
            >
              {line.name}
            </Link>
            <p className="text-xs text-ink/60">Talla {line.size}</p>
          </div>
          <button
            type="button"
            onClick={remove}
            disabled={pending}
            aria-label={`Quitar ${line.name} (talla ${line.size})`}
            className="btn-secondary px-2 py-1"
          >
            ×
          </button>
        </div>

        {!line.available && (
          <span>
            <StampBadge
              variant="agotado"
              label={line.priceCents === null ? "No disponible" : "AGOTADO"}
            />
          </span>
        )}

        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pending || !line.available || line.qty <= 1}
              onClick={() => changeQty(line.qty - 1)}
              aria-label={`Restar una unidad de ${line.name} (talla ${line.size})`}
              className="btn-secondary min-h-8 min-w-8 px-2"
            >
              −
            </button>
            <span
              aria-live="polite"
              className="min-w-8 text-center font-display text-sm font-bold tabular-nums"
            >
              {line.qty}
            </span>
            <button
              type="button"
              disabled={pending || !line.available || line.qty >= line.stock}
              onClick={() => changeQty(line.qty + 1)}
              aria-label={`Sumar una unidad de ${line.name} (talla ${line.size})`}
              className="btn-secondary min-h-8 min-w-8 px-2"
            >
              +
            </button>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink/60">{unitPrice}</p>
            <p className="font-display text-sm font-bold tabular-nums">{lineTotal}</p>
          </div>
        </div>
      </div>
    </li>
  );
}