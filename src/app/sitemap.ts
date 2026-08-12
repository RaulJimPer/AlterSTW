import type { MetadataRoute } from "next";
import {
  getCategories,
  getPublishedProducts,
} from "@/lib/catalog/queries";
import { parseCatalogFilters } from "@/lib/validation/catalog";

async function productSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  const base = parseCatalogFilters({});
  for (let page = 1; page <= 10; page += 1) {
    const result = await getPublishedProducts({ ...base, page });
    for (const item of result.items) slugs.push(item.slug);
    if (!result.hasMore) break;
  }
  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/productos`, lastModified: new Date() },
  ];

  try {
    const [categories, slugs] = await Promise.all([
      getCategories(),
      productSlugs(),
    ]);
    for (const category of categories) {
      entries.push({
        url: `${base}/productos?cat=${category.slug}`,
        lastModified: new Date(),
      });
    }
    for (const slug of slugs) {
      entries.push({
        url: `${base}/productos/${slug}`,
        lastModified: new Date(),
      });
    }
  } catch {
    // Missing env/DB during build: keep the static entries only.
  }

  return entries;
}