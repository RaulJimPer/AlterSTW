import { z } from "zod";
import type { EmailStatus, OrderStatus } from "@/lib/orders/types";

export const ADMIN_PAGE_SIZE = 20;
export const MAX_PRODUCT_IMAGES = 6;
export const MAX_SIZES = 20;

const optionalText = z.string().trim().min(1);
const pageSchema = z.coerce.number().int().min(1);
const productStatusOptions = ["draft", "published"] as const;
const orderStatusOptions = ["paid", "stock_failed"] as const;
const emailStatusOptions = ["pending", "sent", "failed"] as const;

export type SearchParamsRaw = Record<string, string | string[] | undefined>;

export type AdminProductFilters = {
  status?: "draft" | "published";
  categoryId?: string;
  q?: string;
  page: number;
};

export type AdminOrderFilters = {
  status?: OrderStatus;
  emailStatus?: EmailStatus;
  page: number;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOrUndefined(
  schema: z.ZodType<string>,
  value: string | string[] | undefined,
): string | undefined {
  const item = first(value);
  if (item === undefined) return undefined;
  const result = schema.safeParse(item);
  return result.success ? result.data : undefined;
}

function pickOption<const T extends readonly string[]>(
  value: string | string[] | undefined,
  options: T,
): T[number] | undefined {
  const item = first(value);
  if (item === undefined) return undefined;
  return options.includes(item as T[number]) ? (item as T[number]) : undefined;
}

function parsePage(raw: SearchParamsRaw): number {
  const result = pageSchema.safeParse(first(raw.page));
  return result.success ? result.data : 1;
}

export function parseAdminProductFilters(raw: SearchParamsRaw): AdminProductFilters {
  return {
    status: pickOption(raw.status, productStatusOptions),
    categoryId: parseOrUndefined(optionalText, raw.categoryId),
    q: parseOrUndefined(optionalText, raw.q),
    page: parsePage(raw),
  };
}

export function parseAdminOrderFilters(raw: SearchParamsRaw): AdminOrderFilters {
  return {
    status: pickOption(raw.status, orderStatusOptions),
    emailStatus: pickOption(raw.emailStatus, emailStatusOptions),
    page: parsePage(raw),
  };
}

export const productFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(4000),
  priceCents: z.coerce.number().int().nonnegative(),
  categoryId: z.coerce.number().int().positive(),
  images: z.array(z.string().trim().min(1)).max(MAX_PRODUCT_IMAGES),
});
export type ProductFormInput = z.infer<typeof productFormSchema>;

export const sizeRowSchema = z.object({
  size: z.string().trim().min(1).max(24),
  stock: z.coerce.number().int().min(0).max(9999),
  sortOrder: z.coerce.number().int().min(0),
});
export type SizeRowInput = z.infer<typeof sizeRowSchema>;

export const sizesFormSchema = z.array(sizeRowSchema).max(MAX_SIZES);
export type SizesFormInput = z.infer<typeof sizesFormSchema>;

export const stockUpdateSchema = z.object({
  productId: z.coerce.number().int().positive(),
  size: z.string().trim().min(1).max(24),
  stock: z.coerce.number().int().min(0).max(9999),
});
export type StockUpdateInput = z.infer<typeof stockUpdateSchema>;