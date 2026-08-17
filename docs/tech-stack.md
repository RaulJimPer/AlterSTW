# AlterSTW — Tech Stack

Every technology used, the version pinned at scaffold time, and the rationale
behind each decision.

## Frontend & UI

| Technology | Version | Rationale |
|---|---|---|
| Next.js (App Router) | 16.3.0 | SSR/SSG for a fast, SEO-friendly, conversion-oriented landing; server actions and route handlers cover backend glue without a separate API server. |
| React | 19.2.8 | Framework foundation of Next.js 16. |
| TypeScript (strict) | latest via Next | Type safety across the app; `noEmit` typecheck script. |
| Tailwind CSS | ^4 | Next.js default; a utility-first base fits a fully custom visual identity for an alternative-clothing store (no pre-built component library). |
| Recharts | ^3.10.1 | Declarative, composable React charting for the analytics dashboard; chosen over Chart.js for native React ergonomics. |

## Backend (BaaS)

| Technology | Version | Rationale |
|---|---|---|
| Supabase (PostgreSQL) | `@supabase/ssr ^0.12.4`, `@supabase/supabase-js ^2.112.2` | Relational model is the right fit for products, orders and inventory; built-in Auth, Storage and Row Level Security. Chosen over Firebase for the relational + SQL analytics angle. |

## Payments

| Technology | Version | Rationale |
|---|---|---|
| Stripe (server SDK) | ^22.4.0 | Checkout Sessions + webhooks; source of truth for payments. |
| `@stripe/stripe-js` | ^9.13.0 | Browser integration for the checkout flow. |

## Email

| Technology | Version | Rationale |
|---|---|---|
| Resend | ^6.20.0 | Transactional email (order confirmation) sent from the payment webhook via the server SDK; best-effort with `orders.email_status` tracking. Chosen for ergonomics of the SDK + dev inbox (`resend.dev`). |

## Validation

| Technology | Version | Rationale |
|---|---|---|
| Zod | ^4.4.3 | Validate all user input (forms, server actions, webhooks) at runtime. |

## Testing & QA

| Technology | Version | Rationale |
|---|---|---|
| Vitest | ^4.1.10 | Fast unit/component test runner, colocated in `__tests__`. |
| Testing Library | (with Vitest) | DOM assertions for component tests (jsdom). |
| ESLint | Next bundled + config | Static linting via `next lint`. |

## Toolchain & security

- **Node 24 LTS** managed with nvm.
- **npm 12** — supply-chain hardening: dependency install scripts are blocked
  by default (`allowScripts` opt-in), `min-release-age=3` filters freshly
  published packages, and `package-lock.json` is committed. This mitigates
  attacks that abuse install scripts (e.g. the ChainDrop incident, Aug 2026).
- **Git workflow** — Conventional Commits; secrets scan; never push to the
  remote without explicit approval.
- Secrets live only in `.env.local` (gitignored); `.env.example` ships
  placeholders.

## Version pins (initial scaffold)

```json
"next": "16.3.0",
"react": "19.2.8",
"react-dom": "19.2.8",
"tailwindcss": "^4",
"@supabase/ssr": "^0.12.4",
"@supabase/supabase-js": "^2.112.2",
"stripe": "^22.4.0",
"@stripe/stripe-js": "^9.13.0",
"resend": "^6.20.0",
"recharts": "^3.10.1",
"zod": "^4.4.3",
"vitest": "^4.1.10"
```

> Deferred decisions (tracked in `dev-docs/02-stack-tecnologico.md`): none
> remain open for the initial build. The data model is defined per feature,
> not globally.