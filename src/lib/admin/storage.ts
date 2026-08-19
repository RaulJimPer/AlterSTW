import { createBrowserClient } from "@supabase/ssr";

export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export type ImageUploadResult =
  | { ok: true; path: string; url: string }
  | { ok: false; error: string };

export type ImageDeleteResult = { ok: true } | { ok: false; error: string };

function requiredBrowserEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable ${name} in .env.local`);
  }
  return value;
}

export function createBrowserAdminClient() {
  return createBrowserClient(
    requiredBrowserEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredBrowserEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return "Formato no admitido (usa JPG, PNG, WEBP o AVIF).";
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return "La imagen supera los 2 MB.";
  }
  return null;
}

export async function uploadProductImage(
  file: File,
  productSlug: string,
): Promise<ImageUploadResult> {
  const validationError = validateImageFile(file);
  if (validationError !== null) return { ok: false, error: validationError };

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${productSlug}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`;

  const db = createBrowserAdminClient();
  const { error } = await db.storage.from("product-images").upload(path, file, {
    upsert: false,
  });
  if (error) {
    return { ok: false, error: "No se pudo subir la imagen." };
  }

  const { data: publicUrl } = db.storage
    .from("product-images")
    .getPublicUrl(path);

  return { ok: true, path, url: publicUrl.publicUrl };
}

export async function deleteProductImage(
  storagePath: string,
): Promise<ImageDeleteResult> {
  if (!storagePath.startsWith("product-images/")) {
    return { ok: false, error: "Ruta de imagen inválida." };
  }

  const db = createBrowserAdminClient();
  const { error } = await db.storage.from("product-images").remove([storagePath]);
  if (error) {
    return { ok: false, error: "No se pudo borrar la imagen." };
  }

  return { ok: true };
}