import { CartError } from "./errors";
import { MAX_LINES, MAX_QTY } from "./zod";
import type { CartLine } from "./zod";

const clampQty = (qty: number) => Math.min(Math.max(1, qty), MAX_QTY);

function findLine(
  lines: CartLine[],
  slug: string,
  size: string,
): number {
  return lines.findIndex((line) => line.slug === slug && line.size === size);
}

function replaceLine(
  lines: CartLine[],
  index: number,
  line: CartLine,
): CartLine[] {
  return lines.map((item, i) => (i === index ? line : item));
}

export function addLine(lines: CartLine[], line: CartLine): CartLine[] {
  const index = findLine(lines, line.slug, line.size);
  if (index >= 0) {
    const existing = lines[index];
    const nextQty = Math.min(existing.qty + line.qty, MAX_QTY);
    return replaceLine(lines, index, { ...existing, qty: nextQty });
  }
  if (lines.length >= MAX_LINES) throw new CartError("limit-lines");
  return [...lines, { slug: line.slug, size: line.size, qty: clampQty(line.qty) }];
}

export function setLineQty(
  lines: CartLine[],
  slug: string,
  size: string,
  qty: number,
): CartLine[] {
  const index = findLine(lines, slug, size);
  if (index < 0) return lines;
  if (qty <= 0) return removeLine(lines, slug, size);
  return replaceLine(lines, index, { slug, size, qty: clampQty(qty) });
}

export function removeLine(
  lines: CartLine[],
  slug: string,
  size: string,
): CartLine[] {
  return lines.filter((line) => !(line.slug === slug && line.size === size));
}