export type CartErrorCode =
  | "limit-lines"
  | "limit-qty"
  | "limit-bytes"
  | "out-of-stock"
  | "not-found";

export const CART_ERROR_MESSAGES: Record<CartErrorCode, string> = {
  "limit-lines": "Máximo 20 artículos distintos por pedido.",
  "limit-qty": "Máximo 99 unidades por talla.",
  "limit-bytes": "El carrito es demasiado grande; retira algún artículo.",
  "out-of-stock": "No hay stock suficiente de esa talla.",
  "not-found": "Ese artículo ya no está disponible.",
};

export class CartError extends Error {
  readonly code: CartErrorCode;

  constructor(code: CartErrorCode) {
    super(CART_ERROR_MESSAGES[code]);
    this.name = "CartError";
    this.code = code;
  }
}