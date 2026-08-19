import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/catalog/queries", () => ({
  getCategories: vi.fn(),
  getPublishedProducts: vi.fn(),
}));

import { getCategories, getPublishedProducts } from "@/lib/catalog/queries";
import sitemap from "@/app/sitemap";

const BASE = "https://alterstw.example";

describe("sitemap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("lists the static pages of the storefront", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", BASE);
    vi.mocked(getCategories).mockResolvedValue([]);
    vi.mocked(getPublishedProducts).mockImplementation(
      (async () => ({
        items: [],
        page: 1,
        pageSize: 24,
        total: 0,
        hasMore: false,
      })) as never,
    );

    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      `${BASE}/`,
      `${BASE}/productos`,
    ]);
  });

  it("appends category and product URLs from the catalog", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", BASE);
    vi.mocked(getCategories).mockResolvedValue([
      { id: "1", slug: "camisetas", name: "Camisetas", sortOrder: 1 },
    ]);
    let calls = 0;
    vi.mocked(getPublishedProducts).mockImplementation(
      (async () => {
        calls += 1;
        return {
          items:
            calls === 1
              ? [{ slug: "skull-crush-tee" }]
              : [],
          page: 1,
          pageSize: 24,
          total: calls === 1 ? 30 : 0,
          hasMore: calls === 1,
        };
      }) as never,
    );

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain(`${BASE}/productos?cat=camisetas`);
    expect(urls).toContain(`${BASE}/productos/skull-crush-tee`);
    expect(calls).toBeGreaterThan(1);
  });

  it("degrades to the static pages when the catalog is unreachable", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", BASE);
    vi.mocked(getCategories).mockRejectedValue(new Error("db down"));

    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual([
      `${BASE}/`,
      `${BASE}/productos`,
    ]);
  });
});