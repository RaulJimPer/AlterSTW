import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/storefront/add-to-cart-form";
import { FlashSticker } from "@/components/storefront/flash-sticker";
import { HangingPriceTag } from "@/components/storefront/hanging-price-tag";
import { StampBadge } from "@/components/storefront/stamp-badge";
import { getProductBySlug } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (product === null) return {};

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} · AlterSTW`,
      description: product.description.slice(0, 160),
      images: product.images.length > 0 ? product.images : [product.image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (product === null) notFound();

  const images = product.images.length > 0 ? product.images : [product.image];
  const outOfStock = product.badge === "agotado";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          {images.map((src, index) => (
            <div
              key={`${src}-${index}`}
              className="overflow-hidden rounded-print border border-rule"
            >
              <Image
                src={src}
                alt={index === 0 ? product.name : `${product.name} — vista ${index + 1}`}
                width={1200}
                height={1500}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="aspect-[4/5] w-full object-cover"
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <StampBadge variant="category" label={product.categoryName} />
            {product.badge === "nuevo" && <FlashSticker label="NUEVO" />}
            {product.badge === "ultimas" && (
              <StampBadge variant="ultimas" label="ÚLTIMAS" />
            )}
            {product.badge === "agotado" && (
              <StampBadge variant="agotado" label="AGOTADO" />
            )}
          </div>

          <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
            {product.name}
          </h1>

          <HangingPriceTag cents={product.priceCents} size="lg" />

          <AddToCartForm
            slug={product.slug}
            sizes={product.sizes}
            outOfStock={outOfStock}
          />

          <p className="text-sm text-ink/70">
            Envíos en 24–48 h · Devuelve sin complicaciones en 30 días.
          </p>

          <div className="border-t border-rule pt-5">
            <p className="max-w-prose text-base leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}