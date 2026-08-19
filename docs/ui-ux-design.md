# AlterSTW — UI/UX Design System

> Authoritative visual reference for the AlterSTW storefront and admin panel.
> This document is the single source of truth for look-and-feel tokens,
> components and layout. It is complemented by per-feature specs in
> `spec/features/` (behavior, not pixels) and implemented on top of the
> Twitter-style utilities of Tailwind CSS v4.

---

## 1. Design concept

**“Imprenta punk con acento andaluz”** — *a punk print-shop with an Andalusian accent.*

AlterSTW behaves like a hand-printed zine and a street-market stall fused together:

- newsprint-warm paper as the everyday canvas,
- a Risograph tricolor (red leading, yellow and purple following),
- rubber-stamp badges, hanging price tags and ordered stickers as the shop's
  signature vocabulary,
- heavy display type that shouts while the body text speaks calmly,
- a *bajorelieve* (low-relief) Andalusian hint — zaguán tilework and quiet nods
  to Andalusian art — never prominent.

### Principles

1. **The garment wins.** The catalog is deliberately mixed (punk, streetwear,
   grunge, second-hand/vintage). The design frames the product; it never
   competes with it.
2. **Conversion-first.** The interface exists to drive purchases: clear price
   signals, obvious actions, no dead ends.
3. **Restraint is part of the identity.** The punk energy comes from type,
   color discipline and *ordered* details, not from saturation. One loud banner
   per viewport maximum; fewer is better.
4. **Print grammar.** Thin ink rules, sharp corners, structured rows of
   stickers/labels — the page reads like a poster laid on paper.
5. **Fidelity to money.** Prices are exact and always legible (WCAG AA); the
   price color is reserved and never mixed with other signals.
6. **Two faces, one house.** The storefront is expressive; the admin panel is
   deliberately sober (black/white + red) so the owner reads data at a glance.

---

## 2. Color system

### 2.1 Storefront tokens

Named tokens map to Tailwind v4 `@theme` custom properties (see §10).
Values approximate final on-screen mixes; exact values are finalized during
implementation and verified against §8.

| Token | Value | Role |
|---|---|---|
| `paper` | `#F4EFE6` | Base canvas; almost all reading surfaces. |
| `ink` | `#141414` | Main text on paper; titles, body, thin rules. |
| `void` | `#131315` | Dark blocks: hero, footer, marquee zones, stamps-on-dark. Text inside = `paper`. |
| `red` | `#C1121F` | **Primary accent.** Price, CTA fill, urgency, headline keywords, brass-rule keywords. Text-safe on paper (AA). |
| `vermillion` | `#E63946` | Large fills only (CTA on dark, big blocks, graphics). Not for small text (≥ 3:1 for large, decorative). |
| `yellow` | `#FFD60A` | Flash accents: badges with **black text on yellow**, glow on void. Never yellow text on paper (fails AA). |
| `purple` | `#6D28D9` | Text-safe secondary (AA). Editorial/category details, vintage and second-hand stamps. |
| `purple-bright` | `#9B5DE5` | Fills for stickers/chips (large elements). Not for small text. |
| `rule` | ink @ ~15% on paper (`≈ #D2CDC6`) | Borders, frames, hairlines on paper. |
| `rule-dark` | paper @ ~12% on void (`≈ #2C2D2E`) | Borders on dark blocks. |
| `surface-void` | `#1C1C1E` | Card surfaces inside void blocks (slightly lifted). |

### 2.2 Usage rules

- **Red leads.** Prices, primary CTAs, urgency ("ÚLTIMAS", "AGOTADO"), and the
  highlighted keyword inside display headlines. Red is the *one* color a shopper
  learns to follow.
- **Yellow and purple follow quietly.** Micro-details only:
  - yellow → `NUEVO` flashes (black text on yellow), glow accents on void blocks;
  - purple → category rubber stamps, second-hand/vintage stamps, filter-active
    hints, editorial numbering.
- **Yellow is never rendered as text on paper.** It only appears as a fill
  (with black text) or as a glow/stripe on dark blocks.
- **Text-scale accents must be text-safe:** `red` and `purple` small text on
  paper target ≥ 4.5:1. Brighter fills (`vermillion`, `purple-bright`,
  `yellow`) are restricted to large or decorative items.
- **One track, one job:** avoid mixing red price + red badge + red headline in
  the same card; the price stays the reference signal.

### 2.3 Contrast pairs (targets)

| Pair | Contrast | Use |
|---|---|---|
| `ink` / `paper` | ~13:1 | Body, headings on paper. |
| `red` / `paper` | ~5.4:1 | Prices, small text accents (AA normal text). |
| `purple` / `paper` | ~5.9:1 | Category stamps, tags (AA normal text). |
| `paper` / `void` | ~15:1 | Block text, titles on dark. |
| `ink` / `yellow` | ~13:1 | Black text on yellow badges. |
| `white` / `vermillion` | ~4.2:1 | Large CTA labels / graphics only. |

> Final verification happens at implementation with measured values; these are
> design-time targets.

---

## 3. Typography

Two families, loaded via `next/font/google` (variable).

### 3.1 Families

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display | **Bricolage Grotesque** | 600/700/800 | Headlines, big numerals, wordmark. Uppercase, tight tracking. |
| Body | **Space Grotesk** | 400/500/700 | Paragraphs, UI text, tables. Sentence case. |

No monospace is used in the storefront (numbers use tabular figures via
`font-variant-numeric`); the admin panel may use tabular figures in tables.

### 3.2 Type scale (fluid)

| Step | Size / clamp | Line | Track | Use |
|---|---|---|---|---|
| Display XL | `clamp(2.75rem, 6vw, 5rem)` | 0.95 | -0.03em | Hero, 404 numeral |
| Display L | `clamp(2rem, 4vw, 3.5rem)` | 1.0 | -0.02em | Section titles |
| Display M | `clamp(1.5rem, 2.5vw, 2.25rem)` | 1.05 | -0.01em | Card titles, headings |
| Eyebrow | `0.8125rem` | 1.2 | +0.14em | Uppercase labels (categories, "REBAJA") |
| Body L | `1.125rem` | 1.6 | 0 | Long descriptions |
| Body M | `1rem` | 1.55 | 0 | Default text |
| Body S | `0.875rem` | 1.5 | 0 | Captions, footers, disclaimers |
| Price / tag | `1.125rem` display | 1.1 | -0.01em | Hanging price tag, totals |

### 3.3 Voice license

- **Titles shout:** display steps are **UPPERCASE** with tight tracking. One
  keyword per headline may be highlighted `red` (or `yellow` on void) — the
  do-not-overdo rule applies to color, not to voice.
- **Labels whisper:** eyebrows and nav use small uppercase with wide tracking.
- **Body speaks:** sentences in normal case, comfortable leading, full-width
  legible paragraphs; no shouting in description text.
- Strikethroughs and double-underlines are reserved for promotional copy and
  never used in prices or buttons.

---

## 4. Surfaces & texture

- **Newsprint paper** is the default surface everywhere the product or the copy
  needs to breathe: catalog grid, product detail, cart, checkout scaffolding,
  footer text.
- **Void blocks** are used selectively: home hero, campaign band, marquee
  band, page-structure moments, and the site footer masthead zone. Inside void,
  text is `paper`, accents use `vermillion`/`yellow` glows.
- **Zaguán tilework** — a subtle Andalusian-tile motif may be used as a
  low-opacity background pattern (≈ 6–10%) inside void blocks (e.g., footer band,
  select empty-states). It is a *under-relief* garnish: never full-strength,
  never over product photos, never behind text that must carry price data.
- **Grain/micro-texture** appears only on hero and void blocks (a very light
  noise), never in reading-heavy areas, and is reduced/removed under
  `prefers-reduced-motion` plus respects print.

---

## 5. Signature vocabulary (“la firma AlterSTW”)

These recurring details make the shop unmistakable and must stay **ordered**:
no overlapping pieces, no stacks of banners.

1. **Rubber-stamp badges** — rotated ±2°, 2–3px border, uppercase, stamp voice.
   - Status stamps: `NUEVO` (red), `ÚLTIMAS`/`AGOTADO` (`AGOTADO` = void fill,
     paper text), `2.ª MANO`/`VINTAGE` (purple).
2. **Hanging price tag** — the price renders on a hang-tag: small rectangle
   (red border, paper fill) with a string/hole motif to one side. Placed at the
   right end of the card info row; never over the photo. It is the second
   colorful reference after the name.
3. **Stickers in the card footer** — colored chips (red/yellow/purple) for
   flashes (`NUEVO`, `REBAJA`, `ÚNICA PIEZA`). A maximum of **two** per card,
   always inside the frame footer row, never overlapping the photograph.
4. **Andalusian nods** — besides the zaguán tilework, quiet references to
   Andalusian art or classic Andalusian artists may appear in micro-details
   (a footer colophon line, a sticker emblem, an eyebrow on special sections).
   Low relief, explanatory copy, never gratuitous.
5. **Anti-saturation rule** — at most one full-bleed callout/banner per
   viewport; the catalog grid itself stays quiet.

---

## 6. Storefront components & layout

### 6.1 Header — masthead (compact, sticky)

- Sticky top bar; bottom border is a `rule` hairline (2px `ink` on paper).
- Left: wordmark **ALTERSTW** in Bricolage 800 uppercase.
- Center/left: category nav in eyebrow style (uppercase 700, hover = red
  underline). Desktop only; mobile collapses into a drawer sheet.
- Right: search (icon + expandable input, desktop) and cart button with a red
  count badge (circle, `red` fill, paper number).
- On scroll it compresses; it never turns transparent over content.

### 6.2 Product card

Structure (top-to-bottom), inside a `rule` (1px) frame:

1. **Photograph** — full frame width, object-cover, aspect 4:5. Clean; never
   overlapped by text. Hover: slight scale + a primary “AÑADIR” button lift
   (also always reachable in keyboard focus).
2. **Footer row (inside the frame, below the photo):**
   - left: category rubber stamp (purple or red per §5.1) + optional flash
     sticker (max 2);
   - right: **name** in display M uppercase (700) with the **hanging price
     tag** (red) anchored at its right end.

Grid density: **2** columns mobile, **3** tablet, **4** desktop. Cards are
links; the whole frame is clickable with a visible focus outline.

### 6.3 Filters & controls

- **Desktop:** sticky left sidebar — Categoría, Talla, Precio (range), Estado
  (Disponible / Ocasión). Active filter = red stamped label + removable chip.
  Buttons: *Aplicar* (primary red) and *Limpiar* (text).
- **Filter groups are collapsible accordions** (APG disclosure pattern): each
  group header is a button with a rotating chevron (`aria-expanded` +
  `aria-controls`), all groups start **collapsed**, opening one never closes
  the others, and *Limpiar* collapses every group while navigating back to the
  clean catalog. Active-filter chips stay visible above the collapsed groups.
  The sidebar keeps its sticky top position but the page itself scrolls (no
  inner sidebar scrollbar).
- **Mobile:** filters open in a bottom **sheet** (full-height, scrolled), with
  a sticky *Aplicar* primary button at the bottom.
- **Sort:** small dropdown (“Más reciente · Precio ↑ · Precio ↓”).
- **Buttons:** corners **2px** (print rule).
  - Primary: `red` fill, paper text, uppercase 700, hover darkens to a deeper
    red (`≈#9A0E16`).
  - Secondary: 1px `ink` border, `ink` text; hover = `ink` fill, paper text.
  - On void surfaces, primary flips to `vermillion` (large label) or `yellow`
    fill with `ink` text for flashes.
  - Focus: 2px visible offset outline (see §8).

### 6.4 Product detail

- Two-column `lg`: gallery left (main photo + thumbnails, no frame or a hairline
  frame on big images), info right.
- Info column: eyebrow category stamp → name (display L) → **hanging price tag**
  (red, larger) → stock stamp / size selector (tabular chips, active = red) →
  primary *AÑADIR AL CARRITO* → secondary reassurance line (envíos, devoluciones)
  → description in Body L on paper.
- Availability: `AGOTADO` disables the CTA (void stamp) and keeps the price
  visible with a “AVISARME” secondary.

### 6.5 Cart & checkout *(provisional — refine in conversation)*

- Cart opens as a right-side sheet: line rows (thumb + name + size + hanging
  price per line), quantity steppers (2px), subtotal block, primary checkout
  CTA. Empty cart shows a purple stamp “NADA POR AQUÍ” + CTA to the catalog.
- Checkout delegates to **Stripe Checkout** ; local surfaces stay
  minimal paper blocks. Success/cancel pages: simple, branded small stamps,
  no spam.

### 6.6 State pages *(provisional — refine in conversation)*

- **404:** void block, giant Bricolage numeral, red stamp “TE HAS COLADO”,
  link home.
- **Filtered-empty:** paper with zaguán undertone, purple stamp, reset filters CTA.
- **Loading:** skeleton frames as thin-rule boxes; pulse with `prefers-reduced-motion` off.

---

## 7. Admin panel (owner)

Deliberately **unrelated** to the storefront aesthetic: sober, legible,
black/white with red details.

- **Base:** light neutral `#F5F5F4`; ink `#18181B`; borders/grid `#D4D4D8`;
  red `#DC2626` strictly for errors, declines and downward signals.
- **Surfaces:** cards, tables and forms on white/near-white; corners **4–6px**
  rounded (visually distinct from the storefront’s 2px print corners).
- **Charts (Recharts):** categorical palette, one hue per series (e.g.,
  blue/teal/orange/purple/amber) so metrics are told apart at a glance;
  `red` reserved for alerts/declines. Gridlines subtle; numbers use tabular
  figures; labels in Space Grotesk, small.
- **Layout:** fixed sidebar nav (Productos, Inventario, Pedidos, Analítica,
  Ajustes) + content column; dense but breathable tables (6–8px rows).
- Typography uses the same Space Grotesk for consistency of the house; no
  Bricolage shouting in admin.

> **Implemented in feature 004**: the panel routes under `/admin` use a real
> `admin/` path segment (a bare route group would have collapsed into the
> storefront paths), a sober token set lives in `globals.css`
> (`.admin-field`, `.admin-btn`, `.admin-btn-primary` on `#F5F5F4` / `#18181B` /
> `#D4D4D8` / `#DC2626`), the sidebar renders Productos · Inventario · Pedidos,
> and status/pricing read at a glance (pills, `tabular-nums`, es-ES dates).

> **Post-review refinements**: the logout button moved from the sidebar bottom
> to a top-right header next to the admin email; filters expose a single
> "Limpiar filtros" reset; the sizes editor uses a dropdown of common sizes
> with an "Otra talla…" free-text fallback; the login card links back to the
> storefront below it. Product images are served through `next/image` with
> `images.remotePatterns` allowing the Supabase storage host.

---

## 8. Accessibility (WCAG 2.2 AA)

- **Contrast:** all text pairs meet AA (targets in §2.3), verified at
  implementation.
- **Focus:** a visible 2px offset outline (`red` on paper, `paper` on void) on
  every interactive element; reachable and operable with keyboard.
- **Motion:** any marquee/ticker (if used) pauses under `prefers-reduced-motion`
  and offers static fallback; no scroll-jacking, no auto-playing media.
- **Touch targets:** ≥ 44×44 px on mobile; steppers and small chips comply.
- **Text:** no pure-DIY fonts that hurt legibility; descriptions render in
  `Space Grotesk` at readable sizes; `font-variant-numeric` for prices.
- **Images & iconography:** `alt` describes the garment; decorative grain and
  tile patterns are background-only and inert to assistive tech.

---

## 9. Responsive

| Breakpoint | Behavior |
|---|---|
| `base` (<640px) | 2-col grid; filters in bottom sheet; hamburger drawer; stackable detail page; sticky compact header. |
| `md` (≥768px) | 3-col grid; filters still sheet (or left aside if room), product detail two columns. |
| `lg` (≥1024px) | 4-col grid; sticky left filter sidebar; full masthead nav; cart sheet stays. |
| `xl` (≥1280px) | Same structure with wider gutters; max content width ~ `max-w-7xl` centered on paper. |

All surfaces fluid; the newsprint canvas fills the viewport; void blocks and
zaguán patterns scale without cropping text.

---

## 10. Implementation mapping (Tailwind v4 + Next.js)

- Fonts registered in `src/app/layout.tsx` via `next/font/google`:
  `--font-display` (Bricolage Grotesque) and `--font-body` (Space Grotesk).
- Tokens declared in `src/app/globals.css` under Tailwind v4 `@theme`:
  `--color-paper`, `--color-ink`, `--color-void`, `--color-surface-void`,
  `--color-red`, `--color-vermillion`, `--color-yellow`, `--color-purple`,
  `--color-purple-bright`, `--color-rule`, `--color-rule-dark`.
- Utility classes then use semantic names: `bg-paper text-ink`, `text-red`,
  `border-rule`, `bg-void`.
- Radius tokens: storefront `2px`; admin `4–6px` — kept as component-level
  constant classes, not global overrides.
- Official checkpoints: contrast pass (§8), focused states testable, build of
  the storefront and admin in features 001 and 004 respectively.

---

*Conversation record: identity rounds 1–7 concluded 2026-08-12. Cart,
checkout, and state-page treatments are marked “provisional” pending refinement
in session conversation before feature 002/003 specs are finalized.*