# AlterSTW — Repository Architecture

AlterSTW is a **Next.js full-stack application** (App Router): React Server
Components render the storefront, server actions/route handlers cover the
backend glue, Supabase (PostgreSQL) is the database/Auth/Storage with Row
Level Security as the security boundary, and Stripe handles payments.

This document describes the layout of the repository **as it exists in git**.
Local-only, gitignored artifacts are called out so the tree stays accurate
for anyone cloning the project.

---

## 1. Repository tree

```
alterstw/
├── docs/                     # Visible project documentation (English, committed)
│   ├── features.md
│   ├── tech-stack.md
│   ├── ui-ux-design.md
│   ├── seed-catalog.md
│   ├── architecture.md       # this document
│   ├── testing.md
│   └── deployment.md
├── public/
│   ├── images/seed/          # Seeded demo product photos + fallback.svg
│   │   └── CREDITS.txt       # Sources and license for every asset
│   ├── *.svg                 # Next.js scaffold placeholders
│   └── favicon.ico
├── scripts/
│   ├── seed.ts               # Demo catalog seed (service role, idempotent)
│   └── __tests__/            # seed-catalog.test.ts (offline catalog checks)
├── src/
│   ├── app/                  # App Router (storefront routes)
│   │   ├── layout.tsx        # Root layout + last-resort error boundary
│   │   ├── globals.css
│   │   ├── robots.ts         # robots.txt (static)
│   │   ├── sitemap.ts        # sitemap.xml (catalog-driven, degrades gracefully)
│   │   ├── error.tsx         # Root error boundary (client)
│   │   ├── (storefront)/     # Route group: public shop
│   │   │   ├── layout.tsx    # Reads session cart → CartState, CartProvider
│   │   │   ├── page.tsx      # Home (hero / landing)
│   │   │   ├── error.tsx     # Storefront error boundary (client)
│   │   │   ├── not-found.tsx
│   │   │   ├── carrito/      # Full cart page (server-rendered)
│   │   │   └── productos/
│   │   │       ├── page.tsx              # Catalog: filters + pagination
│   │   │       └── [slug]/page.tsx       # Product detail + generateMetadata
│   │   └── __tests__/        # page.test.tsx, sitemap.test.ts
│   ├── components/
│   │   └── storefront/       # Business components (+ __tests__ colocated)
│   │       ├── header.tsx, footer.tsx    # Shell (header is client — mobile nav)
│   │       ├── product-card.tsx, flash-sticker.tsx, stamp-badge.tsx,
│   │       │   hanging-price-tag.tsx     # Card + availability/pricing decoration
│   │       ├── filter-form.tsx, filter-sidebar.tsx, mobile-filter-sheet.tsx,
│   │       │   sort-select.tsx           # Client filtering UI (client)
│   │       ├── size-chips.tsx, add-to-cart-form.tsx   # Detail interaction (client)
│   │       ├── cart/          # cart-context, cart-sheet, cart-lines (client)
│   │       ├── empty-state.tsx, load-more-button.tsx   # Catalog states
│   │       └── …
│   └── lib/
│       ├── catalog/          # Storefront domain
│       │   ├── types.ts      # ProductSummary / ProductDetail / CatalogPage
│       │   ├── queries.ts    # Supabase reads (getPublishedProducts, …)
│       │   ├── availability.ts  # Badge computation (NUEVO / ÚLTIMAS / AGOTADO)
│       │   ├── format.ts     # es-ES EUR formatting (integer cents)
│       │   └── search-params.ts  # URL param patch/format helpers
│       ├── cart/             # Session cart domain
│       │   ├── zod.ts        # Cookie + action input schemas and limits
│       │   ├── types.ts      # CartLineItem / CartState / EMPTY_CART
│       │   ├── errors.ts     # CartError codes + es-ES messages
│       │   ├── totals.ts     # Exact-cent subtotal, count, validity
│       │   ├── reduce.ts     # Pure add/setQty/remove ops
│       │   ├── cart.ts       # alterstw_cart session cookie read/write
│       │   ├── queries.ts    # resolveCart: DB price + per-size stock
│       │   └── actions.ts    # Server actions (addToCart, setQuantity, removeLine)
│       ├── validation/       # Zod schemas for all input (catalog.ts)
│       └── supabase/
│           └── server.ts     # Server client (anon key + RLS, cookies)
├── supabase/
│   └── migrations/           # 001_catalog.sql, 002_catalog_search.sql
├── .env.example              # Configuration template (copy to .env.local)
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json              # npm 12 supply-chain hardening (allowScripts)
├── package-lock.json         # committed
├── tsconfig.json
├── postcss.config.mjs
├── vitest.config.mts         # jsdom, @/ alias, __tests__ include
├── vitest.setup.mts          # jest-dom matchers
└── README.md                 # Project entry point
```

Local-only, **gitignored** artifacts (present on a dev machine, never in git):
`dev-docs/` (session progress + drafts), `spec/` (SDD constitution and feature
specs), `.opencode/`, `.agents/`, `opencode.json`, `skills-lock.json`,
`AGENTS.md`, `.env.local`, and build artifacts (`next-env.d.ts`,
`*.tsbuildinfo`).

## 2. Frontend architecture (RSC-first)

- **Server Components by default.** Data fetching happens inside pages, which
  are async Server Components that call `lib/catalog/queries.ts` with the
  validated filters and render straight to SQL-backed HTML.
- **Client components are the exception** — only for interactivity:
  `header.tsx` (mobile nav + cart sheet trigger), `sort-select.tsx`,
  `size-chips.tsx`, `add-to-cart-form.tsx`, the `cart/` trio
  (`cart-context`, `cart-sheet`, `cart-lines`),
  `filter-form.tsx`/`mobile-filter-sheet.tsx` (FilterForm renders the filter
  groups as a multi-open disclosure accordion whose open/close state lives in
  the component, outside the remountable `<form>`), and the two `error.tsx`
  boundaries. Each is marked `"use client"`.
- **Catalog page** (`(storefront)/productos/page.tsx`): reads `searchParams`,
  parses them through Zod (`lib/validation/catalog.ts` → `parseCatalogFilters`),
  calls `getPublishedProducts`, and renders the grid, count and `Ver más`
  link. `loadMoreHref` rebuilds the URL keeping the active filters.
- **Product detail** (`[slug]/page.tsx`): calls `getProductBySlug`, renders
  badges/prices/size chips, and exports `generateMetadata` for SEO. Unknown
  slugs `notFound()`. The `AddToCartForm` (client) requires an explicit size
  and calls the `addToCart` server action.
- **Cart** (feature 002): `(storefront)/layout.tsx` reads the `alterstw_cart`
  session cookie and resolves it into a server-validated `CartState` passed to
  a `CartProvider`; the masthead badge (`header.tsx`) and the slide-over
  `CartSheet` render the same state, and `/carrito` re-resolves it on a
  dedicated page. All mutations go through server actions
  (`lib/cart/actions.ts`) that re-validate price + per-size stock against the
  DB before writing the cookie; totals are computed in exact cents
  server-side.
- **SEO**: `robots.ts` and a catalog-driven `sitemap.ts`; both are static-safe
  and degrade to the base pages if Supabase is unreachable.
- **Styling**: Tailwind CSS v4 utilities in `globals.css`, following the
  design tokens in `docs/ui-ux-design.md` (paper background, ink text, stamps).

## 3. Data layer & backend glue

- **Database**: PostgreSQL in Supabase. `supabase/migrations/001_catalog.sql`
  defines `categories`, `products`, `product_sizes` with RLS forced on all
  three; the anon role reads only published rows. `002_catalog_search.sql`
  adds `catalog_products_v`, a `security_invoker` view aggregating stock and
  available sizes per product so filtering (`talla`, `av`) and pagination run
  at the database level. Money is integer EUR cents everywhere.
- **Queries** (`lib/catalog/queries.ts`): the storefront interacts only with
  the `catalog_products_v` view (and `product_sizes` for the detail) through
  the **anon** client — never the service role at runtime.
- **Client factory** (`lib/supabase/server.ts`): `@supabase/ssr`
  `createServerClient` with cookie handling; requires
  `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`. RLS is the
  access boundary; there is no app-level auth yet (feature 004).
- **Availability badges**: computed in the app (`lib/catalog/availability.ts`,
  a 14-day NUEVO window, stock ≤ 3 → ÚLTIMAS, stock 0 → AGOTADO), not stored.
- **Cart backend**: `lib/cart/cart.ts` reads/writes the session cookie
  (JSON of `{ slug, size, qty }` lines — **never prices**, byte-guarded
  ~3 KB, at most 20 lines / 99 per line); `lib/cart/queries.ts` re-validates
  each line against `catalog_products_v` + `product_sizes` for the live price
  and per-size stock (degrading to an empty cart if the DB is down).
  `lib/cart/actions.ts` exposes `addToCart`, `setQuantity` and `removeLine`
  as server actions, all Zod-validated, DB-checked, and finalized with
  `revalidatePath("/", "layout")`.
- **Seed** (`scripts/seed.ts`): standalone Node script that uses the
  **service role** (from `.env.local`, `SUPABASE_SERVICE_ROLE_KEY`) to upsert
  categories/products/sizes idempotently. The catalog is exported from the
  module so tests validate it offline; `main()` is gated behind an
  entry-point check so importing it in tests runs nothing.

## 4. Conventions

- **Strict TypeScript**; `camelCase` for variables/functions, `PascalCase`
  for components and types; **`any` is forbidden** without justification.
- **RSC by default**; `'use client'` only where interactivity requires it.
- **All user input is validated with Zod** (`lib/validation/`) before use —
  search params, and later forms, server actions and webhooks.
- **Tests colocated** in `__tests__/` next to the unit (see
  `docs/testing.md`).
- **Money as integer cents**, formatted via `Intl` (`es-ES`, EUR).
- **Security**: secrets live only in `.env.local` (gitignored); the browser
  bundle only ever sees the Supabase anon key and the Stripe publishable key;
  the Stripe secret and webhook secret are server-only. npm 12 supply-chain
  hardening (`allowScripts`, `min-release-age=3`) is the install gate.