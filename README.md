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
  Sessions + webhooks).
- **Admin panel** — product publishing and inventory management for the
  owner.
- **Analytics dashboard** — sales, visits and conversion-rate metrics with
  Recharts.
- **Security by default** — Supabase Row Level Security, strict TypeScript,
  Zod input validation, and npm 12 supply-chain hardening.

## Quickstart

```powershell
# 1. Install dependencies
npm install

# 2. Configure (optional)
#    copy .env.example to .env.local and fill in the Supabase / Stripe keys

# 3. Seed demo catalog (requires Supabase configured + migrations applied)
npm run seed

# 4. Run
npm run dev
```

Then open <http://localhost:3000>.

## Documentation

| Page | Contents |
|------|----------|
| [Features](docs/features.md) | Storefront, cart, checkout, admin panel, analytics dashboard and future extensions |
| [Tech Stack](docs/tech-stack.md) | Every technology, version, and the rationale behind it |

## Testing at a glance

- **Vitest + Testing Library** — unit and component tests placed next to the
  unit under test (inside an `__tests__` folder).
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

> **In development.** AlterSTW is a work-in-progress. The product is built
> feature by feature following Spec-Driven Development Features and behavior may change at any time.