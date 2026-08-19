import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ProductSummary } from "@/lib/catalog/types";
import { FlashSticker } from "./flash-sticker";
import { HangingPriceTag } from "./hanging-price-tag";
import { StampBadge } from "./stamp-badge";

export function ProductCard({ product }: { product: ProductSummary }) {
  const badges: ReactNode[] = [];

  if (product.badge === "nuevo") {
    badges.push(<FlashSticker key="nuevo" label="NUEVO" />);
  } else if (product.badge === "ultimas") {
    badges.push(<StampBadge key="ultimas" variant="ultimas" label="ÚLTIMAS" />);
  }

  if (
    product.categorySlug.includes("vintage") &&
    badges.length < 2 &&
    product.badge !== "agotado"
  ) {
    badges.push(
      <FlashSticker key="segunda-mano" color="purple" label="2.ª MANO" />,
    );
  }

  return (
    <article className="h-full">
      <Link
        href={`/productos/${product.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-print border border-rule bg-paper outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      >
        <div className="relative aspect-[4/5] overflow-hidden border-b border-rule">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-red px-3 py-2 text-center font-display text-xs font-extrabold uppercase tracking-widest text-paper transition-transform duration-300 group-hover:translate-y-0 group-focus-visible:translate-y-0"
          >
            Añadir
          </span>
          {product.badge === "agotado" && (
            <span aria-hidden className="absolute inset-0 bg-paper/60" />
          )}
        </div>
        <div className="flex flex-1 items-start justify-between gap-2 p-3">
          <div className="flex max-w-[55%] flex-col items-start gap-1.5">
            <StampBadge variant="category" label={product.categoryName} />
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-1">{badges}</div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <h3 className="text-right font-display text-sm font-bold uppercase leading-tight tracking-tight">
              {product.name}
            </h3>
            <HangingPriceTag cents={product.priceCents} />
          </div>
        </div>
      </Link>
    </article>
  );
}
