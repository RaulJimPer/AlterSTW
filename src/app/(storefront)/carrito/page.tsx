import type { Metadata } from "next";
import { CartLines } from "@/components/storefront/cart/cart-lines";
import { readCart } from "@/lib/cart/cart";
import { resolveCart } from "@/lib/cart/queries";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const cart = await resolveCart(await readCart());

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="eyebrow mb-6 text-ink">Tu carro</h1>
      <CartLines cart={cart} />
    </div>
  );
}