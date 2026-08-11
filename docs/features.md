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

- Secure payment through **Stripe Checkout Sessions**.
- **Webhooks** to confirm order completion server-side and update inventory.
- Orders recorded for the owner's dashboard.

> Integration details and the order data model will be specified in
> `spec/features/003-checkout-payments/`.

## 5. Admin Panel — Inventory & Products

- **Product publishing**: create, edit, publish/unpublish products.
- **Inventory management**: stock levels per product and size/variant.
- Restricted to authenticated owner/admin users (Supabase auth + RLS).

> CRUD behavior and admin authorization will be specified in
> `spec/features/004-admin-inventory-products/`.

## 6. Analytics Dashboard

- **Sales metrics**: revenue, order counts over time.
- **Visits and conversion rates**: how visitors become customers.
- Charts built with **Recharts**, rendered in the private admin area.

> Metrics definitions and queries will be specified in
> `spec/features/005-analytics-dashboard/`.

## 7. Future extensions

- **Abandoned-cart recovery** — automated emails to recover lost carts.
- **Discount coupons** — coupon creation and application at checkout.
- **Recommendation engine** — complementary product suggestions.

## 8. Open items

- The **data model** (Products, Cart, Orders, Inventory, Coupons) is not
  defined at the global level on purpose: fields, types and relationships
  will be defined per feature inside the SDD specs, starting with the catalog.