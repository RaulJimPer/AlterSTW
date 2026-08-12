# AlterSTW — Deployment Guide

How to install, configure, run, and deploy AlterSTW.

---

## 1. Prerequisites

- **Node.js 24 LTS** (via nvm) and **npm 12** — the pinned toolchain. npm 12
  applies supply-chain hardening (`allowScripts` opt-in,
  `min-release-age=3`), so installs are deliberately gated.
- **Git** (to clone the repository).
- A **Supabase project** (PostgreSQL + Auth + Storage + RLS) for the catalog
  database.
- A **Stripe account** with API keys and (once feature 003 lands) a webhook
  endpoint for checkout.

## 2. Installation

```powershell
git clone <repo-url> alterstw
cd alterstw
npm install
```

`package-lock.json` is committed, and the one install-script dependency
(`unrs-resolver@1.12.2`) is already approved in `allowScripts`. After any
new install, run `npm audit` and review scripts with
`npm install-scripts ls`.

## 3. Configuration

Copy the template and edit it:

```powershell
copy .env.example .env.local
```

| Variable | What to set / notes |
|----------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL. Safe to expose. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key; RLS protects the data. Safe to expose. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, used by `npm run seed` — never used by the app runtime, never exposed to the browser. |
| `STRIPE_SECRET_KEY` | Server-only (feature 003). |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Publishable Stripe key for the browser (feature 003). |
| `STRIPE_WEBHOOK_SECRET` | Server-only, for signed webhook verification (feature 003). |

> `.env.local` is gitignored and must never be committed. Missing required
> variables fail fast at runtime (the server client throws).

## 4. Database

The schema is managed through **SQL migrations** in `supabase/migrations/`
(`001_catalog.sql` defines the RLS tables, `002_catalog_search.sql` the
`catalog_products_v` view). The project has **no local Supabase CLI
configuration** (`supabase/config.toml`); apply the SQL to your project in
order through the Supabase **SQL editor** (migrations are recorded in
`docs/`/`spec`, the applied state lives in the project):

1. `001_catalog.sql` — tables + indexes + RLS policies.
2. `002_catalog_search.sql` — the storefront view.

Migrate first, then seed the demo catalog (idempotent — upserts by `slug`):

```powershell
npm run seed
```

Requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. It writes the 5
categories and 12 demo products, then validates with the public role:
`catalog_products_v` must return all published rows, and an `INSERT` with the
anon key must be **blocked** (RLS).

## 5. Run

Development server (hot reload):

```powershell
npm run dev
```

Open <http://localhost:3000>.

Production preview:

```powershell
npm run build
npm start
```

The seed script is re-runnable whenever the demo data changes
(`scripts/seed.ts` stays the source of truth, mirrored in
`docs/seed-catalog.md`).

## 6. Production notes

- **Hosting**: the idiomatic target for a Next.js App Router app is a Node
  SSR host (e.g. Vercel). The final host decision is still open — flagged in
  the roadmap — but the app builds and runs as a standard `next start`
  server either way. Keep the Supabase anon key + URL as environment
  variables in the host.
- **Server-only secrets** must be configured on the host environment, never
  in a client bundle: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
  `STRIPE_WEBHOOK_SECRET`.
- **Data access** is enforced by Row Level Security: even with the anon key
  public, the storefront only reads published rows. Do not disable FORCE RLS.
- **Payments** (feature 003): Stripe Checkout Sessions + a signed webhook
  confirm orders server-side; register the endpoint with
  `STRIPE_WEBHOOK_SECRET` and switch to live keys only when ready.
- **Static output**: the storefront currently has dynamic routes
  (`/productos`, `/productos/[slug]`, sitemap); a pure static deploy is not
  supported at this stage.

## 7. Troubleshooting

| Symptom | Likely fix |
|---------|-----------|
| `Missing environment variable X in .env.local` | Copy `.env.example` → `.env.local` and fill `X`. |
| `npm install` fails on scripts | Set `allowScripts` for the package (only after reviewing what it runs) — npm 12 blocks scripts by default. |
| Anonymous `INSERT` is blocked (SQL state `42501`) | Expected — RLS reserves writes; the seed uses the service role. |
| `category definitions do not match the declared slugs` | Seed catalog drifted from `scripts/seed.ts`; keep it in sync with `docs/seed-catalog.md`. |
| Seed finds missing assets | `public/images/seed/*` photos are missing on disk; run `npm run seed` from the repo root. |
| Catalog queries return nothing | Check that migrations `001` and `002` were applied and a `npm run seed` ran. |
| Port `3000` already in use | Change it, e.g. `npm run dev -- -p 3001`. |