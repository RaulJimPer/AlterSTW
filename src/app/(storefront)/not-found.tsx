import Link from "next/link";
import { StampBadge } from "@/components/storefront/stamp-badge";

export default function NotFound() {
  return (
    <section className="bg-void text-paper">
      <div className="grain relative mx-auto flex w-full max-w-7xl flex-col items-start gap-6 px-4 py-24">
        <p className="font-display text-8xl font-extrabold uppercase leading-none tracking-tight md:text-9xl">
          404
        </p>
        <StampBadge variant="agotado" label="TE HAS COLADO" />
        <p className="max-w-md text-base leading-relaxed text-paper/80">
          Esa página se ha perdido entre papel y tinta. Mejor vuelve a la tienda
          antes de que se agoten las últimas unidades.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-print bg-vermillion px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-widest text-ink transition-colors hover:bg-yellow"
        >
          Volver a casa
        </Link>
      </div>
    </section>
  );
}