# AlterSTW

A transactional web platform for an alternative-clothing retailer: a
conversion-oriented storefront (showcase / landing) where customers browse an
alternative-clothing catalog, build a cart and pay securely, plus a private
admin panel with an analytics dashboard for the owner.

> **Documentation is organized in [`docs/`](docs/)** — this README is the entry
> point; each topic has a dedicated page with full detail.

## Highlights

- **Conversion-first storefront** — product catalog with dynamic filtering
  and categorization, designed to turn visitors into customers.
- **Secure shopping** — cart management and Stripe checkout (Checkout
  Sessions + signed, idempotent webhooks) with server-validated cart and
  atomic per-size stock decrement.
- **Order confirmation email** — transactional email via Resend,
  best-effort and tracked in the order record.
- **Admin panel** — private product publishing, inventory and read-only
  order history for the owner (Supabase Auth + `admin_users` RLS).
- **Analytics dashboard (Estadísticas)** — private, read-only dashboard under
  `/admin/analytics` with KPI cards (revenue, paid orders, conversion, AOV),
  Recharts charts (sales, visits/conversion, top products, revenue by category),
  a critical-stock table and a Zod-validated range selector (7d/30d/90d/Todo +
  custom). Storefront visits are captured fire-and-forget.
- **Security by default** — Supabase Row Level Security, strict TypeScript,
  Zod input validation, and npm 12 supply-chain hardening.

## Quickstart

Prerequisites: Node 24 LTS (nvm) + npm 12, a Supabase project, and Stripe /
Resend accounts. See [docs/deployment.md](docs/deployment.md) for the full
setup.

```powershell
# 1. Install dependencies
npm install

# 2. Configure
copy .env.example .env.local   # fill in Supabase / Stripe / Resend keys

# 3. Apply database migrations (in order, via the Supabase SQL editor)
#    supabase/migrations/001_catalog.sql
#    supabase/migrations/002_catalog_search.sql
#    supabase/migrations/003_orders.sql
#    supabase/migrations/004_admin.sql
#    supabase/migrations/005_analytics.sql

# 4. Seed demo catalog (idempotent)
npm run seed

# 5. Dev server + Stripe webhooks (two terminals)
npm run dev
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
#    copy the printed whsec_… into STRIPE_WEBHOOK_SECRET in .env.local and restart npm run dev
```

Then open <http://localhost:3000>. Pay with Stripe test card `4242 4242 4242
4242`.

## Documentation

| Page | Contents |
|------|----------|
| [Features](docs/features.md) | Storefront, cart, checkout, admin panel, analytics dashboard and future extensions |
| [Tech Stack](docs/tech-stack.md) | Every technology, version, and the rationale behind it |
| [Architecture](docs/architecture.md) | Repository layout as it exists in git, RSC-first frontend and data-layer glue |
| [Testing](docs/testing.md) | Testing strategy, how to run the suite and the coverage of all 310 tests across 54 files |
| [Deployment](docs/deployment.md) | Install, configure, migrate, seed, run and production notes |
| [Demo seed catalog](docs/seed-catalog.md) | Source of truth for the 12 demo products written by `npm run seed` |
| [UI/UX design](docs/ui-ux-design.md) | Visual identity, accessibility and responsive rules |

## Testing at a glance

- **Vitest + Testing Library** — unit and component tests placed next to the
  unit under test (inside an `__tests__` folder). Full strategy and coverage
  in [docs/testing.md](docs/testing.md).
- Static checks via ESLint and `tsc`.

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

## Tech stack (summary)

- **Frontend:** Next.js 16 (App Router) · React 19 · TypeScript (strict) ·
  Tailwind CSS v4 · Recharts
- **Backend (BaaS):** Supabase (PostgreSQL · Auth · Storage · Row Level
  Security)
- **Payments:** Stripe (Checkout Sessions + Webhooks)
- **Validation:** Zod
- **Dev/QA:** Vitest · Testing Library · ESLint · npm 12 (supply-chain
  hardening)

## Repository layout

- `src/` — application code (Next.js App Router)
- `docs/` — visible documentation (English, committed)
- `spec/` — SDD constitution and feature specs (local-only, not committed)
- `dev-docs/` — internal drafts and daily progress (local-only, not
  committed)
- `.opencode/`, `.agents/` — local OpenCode configuration and skills (not
  committed)

## Status

> **In development.** The storefront is fully functional end-to-end: catalog,
> cart and checkout with Stripe payments and confirmation emails. The admin panel
> is complete and QA-verified by the owner (migration applied, admin
> account granted). The analytics dashboard (Estadísticas) is implemented —
> route `/admin/analytics`, KPI cards, Recharts charts, critical-stock table and
> range selector — with its migration `005_analytics.sql` and manual QA still
> pending on the owner's side.