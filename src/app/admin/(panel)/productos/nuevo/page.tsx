import type { Metadata } from "next";
import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/catalog/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nuevo producto",
};

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[#71717a]">
          <Link href="/admin/productos" className="hover:underline">
            Productos
          </Link>
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">
          Nuevo producto
        </h1>
      </div>
      <ProductForm mode="create" categories={categories} />
    </div>
  );
}