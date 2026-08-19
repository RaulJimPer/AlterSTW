"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import type { CartState } from "@/lib/cart/types";
import { CartLines } from "./cart-lines";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function CartSheet({
  cart,
  open,
  onClose,
}: {
  cart: CartState;
  open: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

    focusables?.[0]?.focus();
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || focusables === undefined || focusables.length === 0) {
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previousFocus?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div aria-hidden onClick={onClose} className="absolute inset-0 bg-void opacity-50" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l-2 border-ink bg-paper shadow-2xl animate-[slide-in-right_200ms_ease-out]"
      >
        <div className="flex items-center justify-between border-b-2 border-ink px-4 py-3">
          <p className="eyebrow text-ink">Tu carro</p>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <CartLines cart={cart} />
        </div>

        {cart.lines.length > 0 && (
          <div className="border-t border-rule px-4 py-3">
            <Link
              href="/carrito"
              onClick={onClose}
              className="text-xs font-bold uppercase tracking-widest text-ink hover:text-red hover:underline"
            >
              Ver carrito completo →
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}