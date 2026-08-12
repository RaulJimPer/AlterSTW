"use client";

import { useState } from "react";

export function AddToCartButton({
  outOfStock,
}: {
  outOfStock: boolean;
}) {
  const [notice, setNotice] = useState(false);

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
          El carrito y los avisos llegan en las próximas actualizaciones.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setNotice(true)}
        aria-describedby={notice ? "cart-notice" : undefined}
        className="btn-primary w-full"
      >
        Añadir al carrito
      </button>
      <button type="button" className="btn-secondary w-full">
        Avisarme
      </button>
      {notice && (
        <p id="cart-notice" role="status" aria-live="polite" className="text-sm text-purple">
          El carrito llega en la siguiente actualización.
        </p>
      )}
    </div>
  );
}
