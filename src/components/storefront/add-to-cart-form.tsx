"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart/actions";
import type { SizeOption } from "@/components/storefront/size-chips";
import { SizeChips } from "@/components/storefront/size-chips";
import { useCart } from "@/components/storefront/cart/cart-context";

type Notice = { tone: "ok" | "error" | "info"; message: string } | null;

const NOTICE_CLASSES: Record<NonNullable<Notice>["tone"], string> = {
  ok: "text-sm text-purple",
  error: "text-sm text-red",
  info: "text-sm text-ink/70",
};

export function AddToCartForm({
  slug,
  sizes,
  outOfStock,
}: {
  slug: string;
  sizes: SizeOption[];
  outOfStock: boolean;
}) {
  const { openCart } = useCart();
  const [selected, setSelected] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, startTransition] = useTransition();

  if (outOfStock) {
    return (
      <div className="flex flex-col gap-2">
        <button type="button" disabled className="btn-primary w-full opacity-50">
          Agotado
        </button>
        <button type="button" className="btn-secondary w-full">
          Avisarme
        </button>
        <p className="text-xs text-ink/60">
          Los avisos de reposición llegan en una próxima actualización.
        </p>
      </div>
    );
  }

  const handleAdd = () => {
    if (selected === null) {
      setNotice({
        tone: "info",
        message: "Elige una talla para añadirla al carrito.",
      });
      return;
    }
    setNotice(null);
    startTransition(async () => {
      const result = await addToCart({ slug, size: selected });
      if (result.ok) {
        setNotice({ tone: "ok", message: "Añadido al carrito." });
        openCart();
      } else {
        setNotice({ tone: "error", message: result.error });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="eyebrow text-ink">Tallas</p>
        <SizeChips sizes={sizes} selected={selected} onSelect={setSelected} />
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending}
          className="btn-primary w-full"
        >
          Añadir al carrito
        </button>
        <button type="button" className="btn-secondary w-full">
          Avisarme
        </button>
      </div>

      {notice !== null && (
        <p role="status" aria-live="polite" className={NOTICE_CLASSES[notice.tone]}>
          {notice.message}
        </p>
      )}
    </div>
  );
}