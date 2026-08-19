import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { SizesEditor } from "@/components/admin/sizes-editor";
import { getAdminProductBySlug } from "@/lib/admin/queries";
import { getCategories } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getAdminProductBySlug(slug);
  return {
    title: product === null ? "Editar producto" : `Editar · ${product.name}`,
  };
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductBySlug(slug),
    getCategories(),
  ]);
  if (product === null) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#71717a]">
          <Link href="/admin/productos" className="hover:underline">
            Productos
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Editar · {product.name}
        </h1>
        <p className="text-sm text-[#71717a]">
          Slug: <span className="font-medium text-[#18181b]">{product.slug}</span>
        </p>
      </div>
      <ProductForm
        mode="edit"
        slug={product.slug}
        initial={{
          name: product.name,
          description: product.description,
          priceCents: product.priceCents,
          categoryId: product.categoryId,
          images: product.images,
        }}
        categories={categories}
      />
      <SizesEditor slug={product.slug} sizes={product.sizes} />
    </div>
  );
}