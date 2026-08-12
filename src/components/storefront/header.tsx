"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/lib/catalog/types";

export function Header({ categories }: { categories: Category[] }) {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const catalogActive = pathname.startsWith("/productos");

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
        <button
          type="button"
          className="btn-secondary px-3 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">Menú</span>
          <span aria-hidden>☰</span>
        </button>

        <Link
          href="/"
          className="font-display text-xl font-extrabold uppercase tracking-tight"
        >
          Alter<span className="text-red">STW</span>
        </Link>

        <nav aria-label="Categorías" className="hidden items-center gap-5 lg:flex">
          <Link
            href="/productos"
            className={`text-xs font-bold uppercase tracking-widest hover:text-red hover:underline ${
              catalogActive ? "text-red" : ""
            }`}
          >
            Catálogo
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/productos?cat=${category.slug}`}
              className="text-xs font-bold uppercase tracking-widest hover:text-red hover:underline"
            >
              {category.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <form action="/productos" method="get" role="search" className="hidden sm:block">
            <input
              type="search"
              name="q"
              placeholder="Buscar"
              aria-label="Buscar en el catálogo"
              className="field w-36 transition-all focus:w-56"
            />
          </form>

          <Link
            href="/carrito"
            aria-label="Carrito (0 productos)"
            className="relative inline-flex min-h-11 items-center gap-1.5 px-1 text-xs font-bold uppercase tracking-widest hover:text-red"
          >
            Carrito
            <span
              aria-hidden
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1 text-[0.625rem] font-bold tabular-nums text-paper"
            >
              0
            </span>
          </Link>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-rule px-4 py-4 lg:hidden">
          <form action="/productos" method="get" role="search" className="mb-4 sm:hidden">
            <input
              type="search"
              name="q"
              placeholder="Buscar"
              aria-label="Buscar en el catálogo"
              className="field"
            />
          </form>
          <nav aria-label="Categorías móvil" className="flex flex-col gap-3">
            <Link
              href="/productos"
              onClick={() => setOpen(false)}
              className={`text-sm font-bold uppercase tracking-widest hover:text-red ${
                catalogActive ? "text-red" : ""
              }`}
            >
              Catálogo
            </Link>
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/productos?cat=${category.slug}`}
                onClick={() => setOpen(false)}
                className="text-sm font-bold uppercase tracking-widest hover:text-red"
              >
                {category.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
