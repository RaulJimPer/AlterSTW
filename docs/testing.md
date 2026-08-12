# AlterSTW — Testing Guide

Testing strategy, how to run the suite, and what exactly is covered.

**Status:** Storefront verified. Suite: **72 Vitest tests across 18 files** +
static gates (ESLint + `tsc --noEmit`) + production build — all green.

---

## 1. Strategy

| Level | Tool | Location | Scope |
|-------|------|----------|-------|
| Unit & component | Vitest + Testing Library | Colocated `__tests__/` per unit | Pure logic (`catalog`, `availability`, `format`, `validation`, seed data) and React components/pages |
| Seed integrity | Vitest (node) | `scripts/__tests__/` | The demo catalog exported by `scripts/seed.ts`, validated offline, without touching Supabase |
| Static gates | ESLint + `tsc --noEmit` | Codebase | Lint rules and strict type safety before anything ships |
| Production build | `next build` | App | Confirms routes, metadata, sitemap/robots and prerendering compile |
| Manual QA | Browser | — | Visual regression, accessibility and responsive behavior (see `docs/ui-ux-design.md` §8/§9) |

Test directory rules:

- Tests are **colocated** next to the unit under test inside an `__tests__`
  folder: `foo.tsx` → `foo.test.tsx` in the same directory.
- **No network in tests.** External services are neutralized with `vi.mock`:
  Supabase query modules, `next/navigation` (including `notFound` via
  `vi.hoisted`), and `next/image`. Components under test use Testing Library
  DOM queries against a jsdom environment.
- `vitest.config.mts` sets the **jsdom** environment, `globals: true`, the
  `vitest.setup.mts` setup file (extends jest-dom matchers), and includes
  `src/**/*.test.{ts,tsx}` plus `scripts/**/*.test.{ts,tsx}`.
- The seed test imports the catalog data **directly** (`export const
  seedCatalog`, `seedCategories`, `assertAllSeedAssets`, `stockTotalOf`) — it
  never reads `.env.local` and never talks to the database.

## 2. How to run

```powershell
# Full unit/component suite (single run)
npm test

# Watch mode
npm run test:watch

# Static gates
npm run lint
npm run typecheck

# Production build (final gate)
npm run build
```

## 3. The Vitest suite (72 tests)

Findings from `npm test` should always end in `Test Files 18 passed (18)`
and `Tests 72 passed (72)`.

### Logic layer

| File | Tests | What is covered |
|------|------:|-----------------|
| `src/lib/validation/__tests__/catalog.test.ts` | 7 | `parseCatalogFilters` via Zod: defaults for empty params, all supported filters, invalid options fall back to defaults, invalid numeric filters dropped, window strings coerced to integer cents, non-integer cents rejected, arrays resolve to their first value. |
| `src/lib/catalog/__tests__/search-params.test.ts` | 6 | `composeCatalogQuery` (patches values, removes keys patched empty/undefined, **always resets the page**), `eurosToCents` (rounding, rejection of invalid/negative) and `centsToEuros` round-trip. |
| `src/lib/catalog/__tests__/format.test.ts` | 2 | `formatPrice` renders EUR amounts in `es-ES` and groups thousands on large amounts. |
| `src/lib/catalog/__tests__/availability.test.ts` | 5 | `computeBadge`: stock `0` → `agotado` regardless of date, fresh releases → `nuevo` within the 14-day window, low stock (≤ 3) → `ultimas`, healthy stock → `null`, missing/malformed date → `ultimas`. |
| `src/lib/catalog/__tests__/queries.test.ts` | 10 | `getCategories` mapping/ordering and error throw; `getPublishedProducts` default sort + pagination, `hasMore` overflow, badge computation, filter → operator translation and failure throw; `getProductBySlug` `null` for unknown slugs, detail with per-size stock; `getAvailableSizes` unique sizes in canonical order. |

### App layer

| File | Tests | What is covered |
|------|------:|-----------------|
| `src/app/__tests__/sitemap.test.ts` | 3 | Static pages only when the catalog is empty, category + product URLs appended from the catalog, and graceful degradation to the static pages when the DB is unreachable. |
| `src/app/__tests__/page.test.tsx` | 1 | Home route renders the brand hero heading. |
| `src/app/(storefront)/productos/[slug]/__tests__/page.test.tsx` | 5 | `notFound` on an unknown slug; detail renders a truthful `AGOTADO` state (disabled add-to-cart); per-size availability; `generateMetadata` SEO output for published products and empty metadata for unknown slugs. |
| `src/app/(storefront)/productos/__tests__` via `productos-page.test.tsx` | 5 | `CatalogPage` empty state (`NADA POR AQUÍ`), product grid + count + `Ver más`, server-side filters flowing into the catalog query, and `loadMoreHref` preserving filters while only bumping the page / omitting defaults. |

### Component layer

| File | Tests | What is covered |
|------|------:|-----------------|
| `stamp-badge.test.tsx` | 4 | Label rendering, agotado void-solid style, default yellow style, price formatting. |
| `product-card.test.tsx` | 5 | Link to the detail page with name/category/price, NUEVO sticker, ÚLTIMAS stamp, second-hand stub on vintage items without badge, and no second-hand stub on agotado items. |
| `header.test.tsx` | 2 | Brand + empty cart badge + desktop category links; mobile navigation opens and closes on category click. |
| `productos-page` (via `src/components/storefront/__tests__`) | 5 | Fully mocked subcomponents: empty state, grid + count + `Ver más`, query filters. |
| `size-chips.test.tsx` | 3 | Per-size availability (title attributes), selection toggle via `aria-pressed`, and a message when there are no sizes. |
| `sort-select.test.tsx` | 2 | Selects the current sort from the URL and rewrites the URL preserving the other filters. |
| `add-to-cart-button.test.tsx` | 2 | Out-of-stock disables purchase and offers a waiting list; clicking announces a cart placeholder through an `aria-live` region. |
| `empty-state.test.tsx` | 2 | `NADA POR AQUÍ` stamp with a reset link, and an honoured custom `resetHref`. |
| `load-more-button.test.tsx` | 2 | Renders nothing without more pages, links to the next page otherwise. |

### Seed integrity

| File | Tests | What is covered |
|------|------:|-----------------|
| `scripts/__tests__/seed-catalog.test.ts` | 6 | The five canonical categories, unique slugs and valid keys, categories/sizes references, **on-disk image check** for every asset, the deliberate badge-state mix (NUEVO/ÚLTIMAS/AGOTADO/neutral), and Spanish copy free of encoding artifacts. |

## 4. Mocking conventions

- **`next/navigation`** is mocked per suite: `usePathname`/`useRouter`/
  `useSearchParams` for client components (`sort-select`, `header`),
  `notFound` via `vi.hoisted` for the product page so the throw is both
  asserted and caught.
- **`next/image`** renders as a plain `<img>` in every component suite.
- **Supabase query modules** (`@/lib/catalog/queries`) are mocked with
  `vi.fn` and resolved per test; the real Supabase client is never exercised.
- **Component isolation** in `CatalogPage` tests replaces `SortSelect`,
  `FilterSidebar` and `MobileFilterSheet` with stubs so the page can be
  asserted without their client-side logic.

## 5. Notes

- `toHaveAccessibleName` is not used for `title`-based naming: Testing Library
  computes the accessible name from content/aria, so size chips are asserted
  via `getByTitle` and `aria-pressed`.
- `sort-select` preserves the existing order of URL parameters (it patches in
  place rather than re-sorting).