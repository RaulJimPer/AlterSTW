# AlterSTW — Testing Guide

Testing strategy, how to run the suite, and what exactly is covered.

**Status:** Storefront + checkout + admin panel + Estadísticas dashboard verified. Suite: **310 Vitest tests across 54 files** +
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

## 3. The Vitest suite (310 tests)

Findings from `npm test` should always end in `Test Files 54 passed (54)`
and `Tests 310 passed (310)`.

### Logic layer

| File | Tests | What is covered |
|------|------:|-----------------|
| `src/lib/validation/__tests__/catalog.test.ts` | 7 | `parseCatalogFilters` via Zod: defaults for empty params, all supported filters, invalid options fall back to defaults, invalid numeric filters dropped, window strings coerced to integer cents, non-integer cents rejected, arrays resolve to their first value. |
| `src/lib/catalog/__tests__/search-params.test.ts` | 6 | `composeCatalogQuery` (patches values, removes keys patched empty/undefined, **always resets the page**), `eurosToCents` (rounding, rejection of invalid/negative) and `centsToEuros` round-trip. |
| `src/lib/catalog/__tests__/format.test.ts` | 2 | `formatPrice` renders EUR amounts in `es-ES` and groups thousands on large amounts. |
| `src/lib/catalog/__tests__/availability.test.ts` | 5 | `computeBadge`: stock `0` → `agotado` regardless of date, fresh releases → `nuevo` within the 14-day window, low stock (≤ 3) → `ultimas`, healthy stock → `null`, missing/malformed date → `ultimas`. |
| `src/lib/catalog/__tests__/queries.test.ts` | 10 | `getCategories` mapping/ordering and error throw; `getPublishedProducts` default sort + pagination, `hasMore` overflow, badge computation, filter → operator translation and failure throw; `getProductBySlug` `null` for unknown slugs, detail with per-size stock; `getAvailableSizes` unique sizes in canonical order. |
| `src/lib/cart/__tests__/zod.test.ts` | 13 | Cart schemas: line/cookie/keys bounds (`MAX_LINES`, `MAX_QTY`), integer qty and string→number coercion, size/slug presence. |
| `src/lib/cart/__tests__/reduce.test.ts` | 12 | Pure `addLine`/`setLineQty`/`removeLine`: consolidation, clamp to limits, qty 0 drops the line, `limit-lines` error on a full cart, same-slug different-size lines kept separate. |
| `src/lib/cart/__tests__/totals.test.ts` | 12 | Exact-cent subtotal (skips unavailable/priceless lines), count of purchasable units, cart validity and `buildCartState`. |
| `src/lib/cart/__tests__/cart.test.ts` | 7 | Session cookie read/write/clear against an in-memory `next/headers` store; missing/corrupt/invalid JSON → empty; writes carry session-scoped options and the ~3 KB byte guard throws `limit-bytes`. |
| `src/lib/cart/__tests__/queries.test.ts` | 7 | `resolveCart`: per-size stock, qty clamping, orphan products outside the catalog, slug deduplication and DB-failure degradation to `EMPTY_CART`. |
| `src/lib/cart/__tests__/actions.test.ts` | 14 | `addToCart`/`setQuantity`/`removeLine`: Zod validation, DB stock gate, consolidation/removal, bounds, persistence and `revalidatePath`; error paths return a discriminated `CartActionResult`. |
| `src/lib/checkout/__tests__/actions.test.ts` | 5 | `createCheckoutSession`: line items with `price_data` (currency/unit_amount/product metadata), site URLs from env, empty-cart error, hard stock gate, Stripe failure → `{ok:false}` and never throws; `clearCartAfterOrder` revalidates the layout. |
| `src/lib/orders/__tests__/queries.test.ts` | 4 | `getOrderByCheckoutSessionId` maps rows to `OrderSummary` + items and returns `null` for unknown/missing/DB-failure cases (Supabase mocked). |
| `src/lib/stripe/__tests__/server.test.ts` | 2 | `getStripe` singleton with `STRIPE_SECRET_KEY`; `verifyStripeWebhook` accepts a valid signature and throws on a bad signature/key. |
| `src/lib/email/__tests__/template.test.ts` | 3 | `renderOrderConfirmation` emits es-ES house HTML (brand, reference, session link, lines, subtotal/total, catalog link) and escapes HTML-sensitive user data. |
| `src/lib/email/__tests__/send.test.ts` | 4 | `sendOrderConfirmation`: valid payload → Resend call with `EMAIL_FROM`; provider error and thrown provider call → `{ok:false}` (never throws); invalid payload → no Resend call. |
| `src/lib/auth/__tests__/actions.test.ts` | 6 | `loginWithPassword`: Zod trim/lowercase + redirect on success, invalid input never reaches Supabase, rejected credentials → generic `{ok:false}` without redirect; `logout` signs out and redirects. |
| `src/lib/auth/__tests__/guard.test.ts` | 5 | `getAdminUser`/`requireAdmin`: no session, session without email, email not in `admin_users`, query error and admin present → `{id,email}`. |
| `src/lib/admin/__tests__/slug.test.ts` | 5 | `slugify` (NFD accent strip, kebab-case, truncate, fallback) and `makeUniqueSlug` (`-2`, `-3` suffixes). |
| `src/lib/admin/__tests__/zod.test.ts` | 6 | `parseAdminProductFilters`/`parseAdminOrderFilters` defaults, valid options, invalid fallbacks; form schemas (product, sizes, stock) bounds. |
| `src/lib/admin/__tests__/queries.test.ts` | 14 | `getAdminProducts` mapping/filters/pagination/stockTotal, `getAdminProductBySlug` + sizes order, `getAdminOrders` filters, `getAdminOrderById` (incl. non-numeric id → null), `getInventoryRows` flattening. |
| `src/lib/analytics/__tests__/zod.test.ts` | 11 | `parseAnalyticsRange`/`toDateRange`: pill defaults (7d/30d/90d), `all` without lower bound, custom valid/invalid (unordered/missing dates → 30d fallback), granularity day (≤30d) / week (>30d), unknown keys ignored. |
| `src/lib/analytics/__tests__/queries.test.ts` | 9 | `getAnalyticsKpis` (zeros / sums / AOV / conversion), `getSalesSeries` (day gaps filled, weekly aggregation, `all` via minDay), `getTopProducts` (revenue rank, limit), `getSalesByCategory`, `getCriticalStock` (≤3). |
| `src/lib/analytics/__tests__/track.test.ts` | 3 | `trackPageVisitAction` inserts a valid path, ignores invalid paths, swallows insert errors (fire-and-forget). |
| `src/lib/admin/__tests__/storage.test.ts` | 10 | `uploadProductImage` path/URL + type/size guards, `deleteProductImage` path guard, `storagePathFromUrl`. |
| `src/lib/admin/__tests__/actions.test.ts` | 17 | `createProduct` (unique slug + draft), `updateProduct` (slug untouched), `setProductStatus`, `saveSizes` (replace + upsert, long custom sizes), `setStock`, `removeImage` (storage first) — all with `requireAdmin` + Zod + `revalidatePath`. |

### App layer

| File | Tests | What is covered |
|------|------:|-----------------|
| `src/app/__tests__/sitemap.test.ts` | 3 | Static pages only when the catalog is empty, category + product URLs appended from the catalog, and graceful degradation to the static pages when the DB is unreachable. |
| `src/app/__tests__/page.test.tsx` | 1 | Home route renders the brand hero heading. |
| `src/app/(storefront)/productos/[slug]/__tests__/page.test.tsx` | 5 | `notFound` on an unknown slug; detail renders a truthful `AGOTADO` state (disabled add-to-cart); per-size availability; `generateMetadata` SEO output for published products and empty metadata for unknown slugs. |
| `src/app/(storefront)/productos/__tests__` via `productos-page.test.tsx` | 5 | `CatalogPage` empty state (`NADA POR AQUÍ`), product grid + count + `Ver más`, server-side filters flowing into the catalog query, and `loadMoreHref` preserving filters while only bumping the page / omitting defaults. |
| `src/app/(storefront)/carrito/__tests__/page.test.tsx` | 3 | Metadata title; re-resolves the cookie via mocked `readCart` + `resolveCart` and renders lines/totals; empty state with a CTA back to the catalog. |
| `src/app/api/webhooks/stripe/__tests__/route.test.ts` | 9 | Signature failure → 400 without processing; non-completed events ignored; retrieve failure → 500; paid order records the RPC with session data and sends the email once; replay (`exists`) and `stock_failed` skip the email; email failure / missing customer email mark `email_status=failed` and still answer 200; RPC error → 500. |
| `src/app/(storefront)/checkout/success/__tests__/page.test.tsx` | 5 | Redirects home without `session_id`; soft "confirming" state while the webhook has not landed / read fails; renders the stored order summary once confirmed (lines, totals); stock-failed notice; `ClearCartOnce` clears the cart. |
| `src/app/(storefront)/checkout/cancel/__tests__/page.test.tsx` | 2 | Friendly cancel message, cart untouched, links kept to cart/catalog. |
| `src/app/admin/login/__tests__/page.test.tsx` | 1 | Admin login card renders the credential fields, submit button and a link back to the storefront home. |
| `src/app/admin/(panel)/productos/__tests__/page.test.tsx` | 8 | Empty state; table with status pills + inline publish buttons; filters flowing into the query + preserved search form; `Ver más`; reset-filters link only when a filter is active; `productListHref` keeps filters / omits defaults. |
| `src/app/admin/(panel)/pedidos/__tests__/page.test.tsx` | 8 | Empty state; order table scoped to the table (totals, status/email pills); filters flowing into the query; `Ver más`; reset-filters link only when a filter is active; `orderListHref` keeps filters / omits defaults. |
| `src/app/admin/(panel)/pedidos/[id]/__tests__/page.test.tsx` | 2 | `notFound` on an unknown order; detail renders customer, items, unit×qty lines and totals. |
| `src/app/admin/(panel)/analytics/__tests__/page.test.tsx` | 3 | Estadísticas page renders KPIs for a populated range, empty state when no orders/visits, and never renders `NaN` in conversion. |

### Component layer

| File | Tests | What is covered |
|------|------:|-----------------|
| `stamp-badge.test.tsx` | 4 | Label rendering, agotado void-solid style, default yellow style, price formatting. |
| `product-card.test.tsx` | 5 | Link to the detail page with name/category/price, NUEVO sticker, ÚLTIMAS stamp, second-hand stub on vintage items without badge, and no second-hand stub on agotado items. |
| `header.test.tsx` | 4 | Brand + empty cart badge + desktop category links; live badge count; opening the cart sheet from the masthead; mobile navigation opens and closes on category click. |
| `productos-page` (via `src/components/storefront/__tests__`) | 5 | Fully mocked subcomponents: empty state, grid + count + `Ver más`, query filters. |
| `size-chips.test.tsx` | 3 | Per-size availability (title attributes), selection toggle via `aria-pressed`, and a message when there are no sizes. |
| `sort-select.test.tsx` | 2 | Selects the current sort from the URL and rewrites the URL preserving the other filters. |
| `filter-form.test.tsx` | 5 | Collapsible filter groups as a disclosure accordion: all groups closed by default with hidden panels, independent toggling (opening one keeps others open), Limpiar pointing to `/productos` and collapsing every group, defaults re-derived from a clean URL after navigation, and an active-filter group rendering closed with its removable chip. |
| `add-to-cart-form.test.tsx` | 4 | Enforces explicit size selection (prompts before adding), adds the selected size and opens the sheet, surfaces server-action errors, and the sold-out branch without a size selector. |
| `cart/cart-sheet.test.tsx` | 7 | Empty state; lines + live subtotal + disabled checkout CTA for an invalid cart; full-cart `/carrito` link; ESC/Cerrar dismissal; focus to the panel, scroll-lock on open and restore on close. |
| `cart/cart-lines.test.tsx` | 6 | Steppers bounded by stock and quantity one, removal with `router.refresh()`, unavailable lines (disabled steppers, badged), and the enabled checkout CTA which opens the Stripe session URL via `createCheckoutSession` ("Abriendo pago…" pending state) and surfaces load errors inline. |
| `empty-state.test.tsx` | 2 | `NADA POR AQUÍ` stamp with a reset link, and an honoured custom `resetHref`. |
| `load-more-button.test.tsx` | 2 | Renders nothing without more pages, links to the next page otherwise. |
| `admin/login-form.test.tsx` | 2 | Submits email/password to the server action and surfaces the returned es-ES error inline. |
| `admin/admin-shell.test.tsx` | 1 | Renders the sidebar nav, the admin email and the top-right logout button around the page content. |
| `admin/analytics/__tests__/range-selector.test.tsx` | 2 | Preset click pushes `range=…` without custom dates; custom range preserves other search params. |

### Seed integrity

| File | Tests | What is covered |
|------|------:|-----------------|
| `scripts/__tests__/seed-catalog.test.ts` | 6 | The five canonical categories, unique slugs and valid keys, categories/sizes references, **on-disk image check** for every asset, the deliberate badge-state mix (NUEVO/ÚLTIMAS/AGOTADO/neutral), and Spanish copy free of encoding artifacts. |

## 4. Mocking conventions

- **`next/navigation`** is mocked per suite: `usePathname`/`useRouter`/
  `useSearchParams` for client components (`sort-select`, `header`,
  `CartLines`, `AddToCartForm`), `notFound` via `vi.hoisted` for the product
  page so the throw is both asserted and caught.
- **`next/headers`** (session cookies) and **`next/cache`**
  (`revalidatePath`) are mocked for the cart; the cookie store is an
  in-memory `Map` created inside `vi.hoisted` so `readCart`/`writeCart`
  assertions can inspect the exact persisted payload.
- **`next/image`** renders as a plain `<img>` in every component suite.
- **Supabase query modules** (`@/lib/catalog/queries`, the cart
  `resolveCart`) are mocked with `vi.fn`/fake query builders and resolved per
  test; the real Supabase client is never exercised.
- **Component isolation** in `CatalogPage` tests replaces `SortSelect`,
  `FilterSidebar` and `MobileFilterSheet` with stubs so the page can be
  asserted without their client-side logic.

## 5. Notes

- `toHaveAccessibleName` is not used for `title`-based naming: Testing Library
  computes the accessible name from content/aria, so size chips are asserted
  via `getByTitle` and `aria-pressed`.
- `sort-select` preserves the existing order of URL parameters (it patches in
  place rather than re-sorting).
- The `Intl` es-ES formatter emits a non-breaking space that the Testing
  Library normalizer collapses, so `formatPrice` assertions on DOM nodes use a
  plain space in `getByText`; when a line total equals the subtotal, use
  `getAllByText(...)` and assert the count.
- `router.refresh()` runs after an awaited server action, so stepper/removal
  tests await it with `waitFor`; the second of two rapid clicks on a stepper
  is swallowed by `useTransition`'s `pending`, so +/- paths are separate
  tests.
- **Vitest 4.1.10 regression (#10845):** a rejection produced by
  `mockRejectedValue` that the code under test *catches* is still reported as
  a test error when the mock is reset in `beforeEach` (`mock.reset()` /
  `mockClear`). Workaround in `src/lib/email/__tests__/send.test.ts`: the mock
  is reset in `afterEach` instead, keeping the fail-open tests green.