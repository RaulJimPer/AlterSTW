import { z } from "zod";

export const PAGE_SIZE = 24;

export const sortOptions = ["nuevos", "precio-asc", "precio-desc"] as const;
export type SortOption = (typeof sortOptions)[number];

export const availabilityOptions = ["todos", "disponible", "ultimas"] as const;
export type AvailabilityOption = (typeof availabilityOptions)[number];

export type CatalogFilters = {
  cat?: string;
  talla?: string;
  min?: number;
  max?: number;
  av: AvailabilityOption;
  sort: SortOption;
  q?: string;
  page: number;
};

const optionalText = z.string().trim().min(1);
const optionalCents = z.coerce.number().int().nonnegative();
const pageSchema = z.coerce.number().int().min(1);

export type SearchParamsRaw = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseOrUndefined<T>(
  schema: z.ZodType<T>,
  value: string | string[] | undefined,
): T | undefined {
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

export function parseCatalogFilters(raw: SearchParamsRaw): CatalogFilters {
  return {
    cat: parseOrUndefined(optionalText, raw.cat),
    talla: parseOrUndefined(optionalText, raw.talla),
    min: parseOrUndefined(optionalCents, raw.min),
    max: parseOrUndefined(optionalCents, raw.max),
    av: pickOption(raw.av, availabilityOptions) ?? "todos",
    sort: pickOption(raw.sort, sortOptions) ?? "nuevos",
    q: parseOrUndefined(optionalText, raw.q),
    page: parseOrUndefined(pageSchema, raw.page) ?? 1,
  };
}
