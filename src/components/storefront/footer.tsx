import Link from "next/link";
import type { Category } from "@/lib/catalog/types";
import { FlashSticker } from "./flash-sticker";

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="tilework relative mt-auto bg-void text-paper">
      <div className="mx-auto w-full max-w-7xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-display text-xl font-extrabold uppercase tracking-tight">
              AlterSTW
            </p>
            <p className="mt-1 max-w-sm text-sm text-paper/70">
              Imprenta punk con acento andaluz. Ropa alternativa, streetwear y
              segunda mano con carácter.
            </p>
          </div>
          <nav
            aria-label="Categorías"
            className="flex flex-wrap items-center gap-4"
          >
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/productos?cat=${category.slug}`}
                className="text-xs font-bold uppercase tracking-widest text-paper/80 hover:text-yellow"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-rule-dark pt-6">
          <div className="flex flex-wrap gap-2" aria-hidden>
            <FlashSticker label="HECHO EN SEVILLA" />
            <FlashSticker color="purple" label="2.ª MANO" />
            <FlashSticker color="red" label="EDICIÓN LIMITADA" />
          </div>
          <p className="text-xs text-paper/60">
            © {new Date().getFullYear()} AlterSTW · imprenta punk con acento
            andaluz
          </p>
        </div>
      </div>
    </footer>
  );
}
