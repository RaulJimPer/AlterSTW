export type Category = {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
};

export type ProductBadge = "nuevo" | "ultimas" | "agotado" | null;

export type ProductSummary = {
  id: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  categorySlug: string;
  categoryName: string;
  stockTotal: number;
  badge: ProductBadge;
  publishedAt: string;
};

export type ProductDetail = ProductSummary & {
  description: string;
  images: string[];
  sizes: { size: string; stock: number; available: boolean }[];
};

export type CatalogPage = {
  items: ProductSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};
