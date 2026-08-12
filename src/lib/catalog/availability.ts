import type { ProductBadge } from "./types";

export const NUEVO_WINDOW_DAYS = 14;
const NUEVO_WINDOW_MS = NUEVO_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function computeBadge(
  stockTotal: number,
  publishedAt: string | null,
): ProductBadge {
  if (stockTotal === 0) return "agotado";
  const publishedMs = publishedAt ? Date.parse(publishedAt) : Number.NaN;
  if (!Number.isNaN(publishedMs) && Date.now() - publishedMs <= NUEVO_WINDOW_MS) {
    return "nuevo";
  }
  if (stockTotal <= 3) return "ultimas";
  return null;
}
