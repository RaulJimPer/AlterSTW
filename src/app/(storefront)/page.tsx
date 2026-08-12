import Link from "next/link";
import { ProductCard } from "@/components/storefront/product-card";
import { StampBadge } from "@/components/storefront/stamp-badge";
import { getCategories, getPublishedProducts } from "@/lib/catalog/queries";
import { parseCatalogFilters } from "@/lib/validation/catalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, latest] = await Promise.all([
    getCategories(),
    getPublishedProducts(parseCatalogFilters({ sort: "nuevos" })),
  ]);
  const items = latest.items.slice(0, 8);

  return (
    <>
      <section className="bg-void text-paper">
        <div className="grain relative mx-auto w-full max-w-7xl px-4 py-20 md:py-28">
          <p className="eyebrow mb-6 text-yellow">
            Ropa alternativa · Imprenta punk con acento andaluz
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-extrabold uppercase leading-none tracking-tight md:text-7xl">
            Qué bien se ve
            <br />
            lo <span className="text-yellow">diferente</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-paper/80">
            Punk, streetwear y segunda mano seleccionados a mano. Piezas con
            carácter, sin molde y sin reglas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/productos"
              className="inline-flex min-h-11 items-center justify-center rounded-print bg-vermillion px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-widest text-ink transition-colors hover:bg-yellow"
            >
              Ver catálogo
            </Link>
            <Link
              href="/productos?av=ultimas"
              className="inline-flex min-h-11 items-center justify-center rounded-print border-2 border-paper/30 px-6 py-2.5 font-display text-sm font-extrabold uppercase tracking-widest text-paper transition-colors hover:border-yellow hover:text-yellow"
            >
              Últimas unidades
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold uppercase tracking-tight">
            Lo <span className="text-red">nuevo</span>
          </h2>
          <Link href="/productos" className="eyebrow shrink-0 text-red hover:underline">
            Ver todo →
          </Link>
        </div>
        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="border border-rule bg-paper px-4 py-8 text-center text-sm text-ink/70">
            El catálogo está cobrando vida. Vuelve en un momento.
          </p>
        )}
      </section>

      <section className="border-t border-rule">
        <div className="mx-auto w-full max-w-7xl px-4 py-10">
          <p className="eyebrow mb-6 text-ink">Compra por estilo</p>
          <div className="flex flex-wrap gap-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/productos?cat=${category.slug}`}
                className="hover:opacity-80"
              >
                <StampBadge variant="category" label={category.name} />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}