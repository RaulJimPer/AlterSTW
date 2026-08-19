"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createProduct, removeImage, updateProduct } from "@/lib/admin/actions";
import { slugify } from "@/lib/admin/slug";
import {
  deleteProductImage,
  storagePathFromUrl,
  uploadProductImage,
} from "@/lib/admin/storage";
import { MAX_PRODUCT_IMAGES } from "@/lib/admin/zod";
import type { Category } from "@/lib/catalog/types";

type ImageItem = { url: string; storagePath: string; persisted: boolean };

type ProductFormProps = {
  mode: "create" | "edit";
  slug?: string;
  initial?: {
    name: string;
    description: string;
    priceCents: number;
    categoryId: string;
    images: string[];
  };
  categories: Category[];
};

export function ProductForm({ mode, slug, initial, categories }: ProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(
    initial ? String(initial.priceCents / 100) : "",
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [images, setImages] = useState<ImageItem[]>(
    (initial?.images ?? []).map((url) => ({
      url,
      storagePath: storagePathFromUrl(url),
      persisted: true,
    })),
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const folder =
    mode === "edit" && slug !== undefined ? slug : slugify(name) || "producto";

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file === undefined) return;
    setUploadError(null);
    setUploading(true);
    startTransition(async () => {
      const result = await uploadProductImage(file, folder);
      setUploading(false);
      if (result.ok) {
        setImages((prev) => [
          ...prev,
          {
            url: result.url,
            storagePath: storagePathFromUrl(result.url),
            persisted: false,
          },
        ]);
      } else {
        setUploadError(result.error);
      }
    });
  };

  const handleRemoveImage = (item: ImageItem) => {
    if (item.persisted && mode === "edit" && slug !== undefined) {
      startTransition(async () => {
        const result = await removeImage(slug, item.storagePath);
        if (result.ok) {
          setImages((prev) => prev.filter((image) => image.url !== item.url));
          router.refresh();
        } else {
          setError(result.error);
        }
      });
    } else {
      startTransition(async () => {
        await deleteProductImage(item.storagePath);
        setImages((prev) => prev.filter((image) => image.url !== item.url));
      });
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const priceCents = Math.round(parseFloat(price) * 100);
    if (Number.isNaN(priceCents) || priceCents < 0) {
      setError("Indica un precio válido en euros.");
      return;
    }

    const input = {
      name,
      description,
      priceCents,
      categoryId,
      images: images.map((image) => image.url),
    };

    startTransition(async () => {
      const result =
        mode === "edit" && slug !== undefined
          ? await updateProduct(slug, input)
          : await createProduct(input);
      if (result.ok) {
        if (mode === "create" && result.slug !== undefined) {
          router.push(`/admin/productos/${result.slug}/editar`);
        } else {
          router.refresh();
        }
      } else {
        setError(result.error);
      }
    });
  };

  const atImageLimit = images.length >= MAX_PRODUCT_IMAGES;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="rounded-lg border border-[#d4d4d8] bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">
              Nombre
            </span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={120}
              className="admin-field"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">
              Precio (€)
            </span>
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              required
              className="admin-field"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">
              Categoría
            </span>
            <select
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              required
              className="admin-field"
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">
              Descripción
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              maxLength={4000}
              className="admin-field"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-[#d4d4d8] bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#52525b]">
            Imágenes ({images.length}/{MAX_PRODUCT_IMAGES})
          </p>
          <label className="admin-btn cursor-pointer">
            {uploading ? "Subiendo…" : "Subir imagen"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleUpload}
              disabled={uploading || atImageLimit}
              className="sr-only"
            />
          </label>
        </div>
        {uploadError !== null && (
          <p role="alert" className="mt-2 text-sm text-[#dc2626]">
            {uploadError}
          </p>
        )}
        {images.length === 0 ? (
          <p className="mt-4 text-sm text-[#71717a]">
            Todavía no hay imágenes. Sube una foto del producto.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((item) => (
              <div
                key={item.url}
                className="group relative overflow-hidden rounded border border-[#d4d4d8]"
              >
                <Image
                  src={item.url}
                  alt=""
                  width={400}
                  height={500}
                  className="aspect-[4/5] w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(item)}
                  disabled={pending}
                  className="absolute right-2 top-2 rounded bg-[#18181b]/80 px-2 py-1 text-xs font-semibold text-white hover:bg-[#dc2626]"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {error !== null && (
        <p role="alert" className="text-sm text-[#dc2626]">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className="admin-btn-primary">
          {pending
            ? "Guardando…"
            : mode === "create"
              ? "Crear producto"
              : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}