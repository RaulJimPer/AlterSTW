export function composeCatalogQuery(
  current: URLSearchParams,
  patch: Record<string, string | undefined>,
): string {
  const next = new URLSearchParams(current.toString());
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === "") {
      next.delete(key);
    } else {
      next.set(key, value);
    }
  }
  next.delete("page");
  const query = next.toString();
  return query ? `?${query}` : "";
}

export function eurosToCents(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return undefined;
  return Math.round(number * 100);
}

export function centsToEuros(cents: string | undefined): string {
  if (!cents) return "";
  const number = Number(cents);
  if (!Number.isFinite(number)) return "";
  return String(number / 100);
}
