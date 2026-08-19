# AlterSTW — Features

AlterSTW is a transactional web platform for an alternative-clothing retailer.
It operates as a conversion-oriented storefront where customers discover the
catalog and complete purchases, and as a private admin panel where the owner
manages the shop and measures its performance with an analytics dashboard.

This document breaks down every functional area of the application.

---

## 1. Roles

- **Customer** (public, no account required): browses the catalog, filters
  products, manages a cart and pays through a secure checkout.
- **Owner / Admin** (private, authenticated): publishes and manages products,
  controls inventory and reviews business analytics.

## 2. Storefront — Product Catalog

The public showcase is the primary conversion surface.

- **Product catalog** with dynamic **filtering and categorization** (e.g.
  category, size, price range, availability).
- Conversion-oriented presentation: clear product cards, visual hierarchy and
  fast, SEO-friendly rendering (Next.js App Router SSR).
- Product detail views with the information a shopper needs to decide (price,
  description, images, availability).

> Details of the catalog feature (fields, filters, UI) will be specified in
> `spec/features/001-product-catalog/` before implementation.

## 3. Shopping Cart

- Add, remove and update quantities of products.
- Cart state persists across the customer session.
- Clear entry into checkout.

> Session persistence mechanics and data model will be defined in
> `spec/features/002-shopping-cart/`.

## 4. Checkout & Payments (Stripe)

- Secure payment through **Stripe Checkout Sessions** (`mode: payment`, EUR,
  per-size line items with product metadata; the server action re-validates
  the cart and per-size stock before opening a session).
- **Webhook** (`POST /api/webhooks/stripe`) verifies the Stripe signature and
  records paid orders through the transactional `record_checkout_payment` RPC:
  `orders` + `order_items` in cents, idempotent on `checkout_session_id`,
  atomic per-size stock decrement gated by `stock >= qty` — `stock_failed`
  orders never apply a partial discount.
- Result pages: `/checkout/success` (paper-slip order summary with a soft
  "confirming…" state until the webhook lands, cart cleared once) and
  `/checkout/cancel` (friendly return, cart intact).
- **Order confirmation email** (Resend, best-effort): sent from the webhook
  only after the first `paid` insert, tracked on
  `orders.email_status`/`email_sent_at`; house es-ES HTML with the order
  summary.

> Taxes and shipping remain deferred to a future extension (see §7).

## 5. Admin Panel — Inventory & Products

- **Product publishing**: create, edit, publish/unpublish products (unique
  immutable slug auto-generated from the name, `draft` on creation, publish
  stamps `published_at`).
- **Inventory management**: stock levels per product and size/variant — inline
  editing from the Inventario table or via the sizes editor on the product
  page.
- **Product images**: upload straight from the browser to the public
  `product-images` bucket (JPG/PNG/WEBP/AVIF, ≤2 MB, ≤6 per product), with
  removal cleaning the storage object.
- **Orders** (read-only): the panel reuses the `email_status` tracking
  persisted by feature 003 via new admin `select` policies in
  `004_admin.sql` (`003_orders.sql` stays untouched).
- **Auth**: Supabase Auth email+password (login only), guarded by a real
  `admin_users` table + `is_admin()` RLS helper; every panel route under
  `/admin` is `noindex` and the `(panel)` layout redirects to `/admin/login`
  without a valid session.

> Implemented (feature 004). Spec: `spec/features/004-admin-inventory-products/`.

## 6. Analytics Dashboard

- **Sales metrics**: revenue, order counts over time.
- **Visits and conversion rates**: how visitors become customers.
- Charts built with **Recharts**, rendered in the private admin area.

> Metrics definitions and queries will be specified in
> `spec/features/005-analytics-dashboard/`.

## 7. Future extensions

- **Shipping** (extension of 003) — shipping rate options and an address at
  checkout (deferred; reuses the 003 pages/orders pipeline).
- **Abandoned-cart recovery** — automated emails to recover lost carts
  (reuses the `src/lib/email/` API shipped with 003).
- **Discount coupons** — coupon creation and application at checkout.
- **Recommendation engine** — complementary product suggestions.

## 8. Open items

- The **data model** (Products, Cart, Orders, Inventory, Coupons) is not
  defined at the global level on purpose: fields, types and relationships
  will be defined per feature inside the SDD specs, starting with the catalog.