import type { Metadata } from "next";
import Link from "next/link";
import { StampBadge } from "@/components/storefront/stamp-badge";

export const metadata: Metadata = {
  title: "Pago cancelado",
  robots: { index: false, follow: false },
};

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="tilework-on-paper flex flex-col items-center gap-4 rounded-print border border-rule bg-paper px-6 py-16 text-center">
        <StampBadge variant="vintage" label="OTRA VEZ SERÁ" />
        <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight md:text-3xl">
          Te esperamos en la tienda
        </h1>
        <p className="max-w-md text-sm leading-relaxed">
          No se ha cobrado nada y tu carrito sigue exactamente como lo dejaste.
          Cuando quieras, vuelve a por ello.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/carrito" className="btn-primary">
            Revisar el carrito
          </Link>
          <Link href="/productos" className="btn-secondary">
            Seguir explorando
          </Link>
        </div>
      </div>
    </div>
  );
}