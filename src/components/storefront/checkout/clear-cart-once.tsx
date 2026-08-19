"use client";

import { useEffect } from "react";
import { clearCartAfterOrder } from "@/lib/checkout/actions";

// Limpia la cookie del carrito una única vez al confirmar el pedido, para que
// el próximo viaje al catálogo arranque con el carro vacío.
export function ClearCartOnce() {
  useEffect(() => {
    void clearCartAfterOrder();
  }, []);

  return null;
}