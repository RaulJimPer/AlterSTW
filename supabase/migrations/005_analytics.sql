-- 005_analytics: analytics dashboard read models (feature 005).
-- Authoritative source: spec/features/005-analytics-dashboard/plan.md
-- Adds a page-view counter (page_visits) written fire-and-forget by the
-- storefront, plus aggregated security_invoker VIEWs that the admin dashboard
-- reads through the existing is_admin() RLS boundary (shipped in 004_admin.sql).
-- 001..004 are NOT touched. Idempotent so the file can be re-run safely in the
-- SQL editor (owner applies in order 001 -> 005 before QA).

-- Page views (total hits; no PII). One row per storefront hit.
create table if not exists page_visits (
  id bigint generated always as identity primary key,
  path text not null,
  visited_at timestamptz not null default now()
);

alter table page_visits force row level security;

-- The storefront inserts without authenticating (fire-and-forget writer).
-- No anonymous/public SELECT: only the admin reads.
drop policy if exists "page_visits_anon_insert" on page_visits;
create policy "page_visits_anon_insert" on page_visits
  for insert to anon, authenticated with check (true);

-- Admin read reuses is_admin() from 004 (stable security definer).
drop policy if exists "page_visits_admin_read" on page_visits;
create policy "page_visits_admin_read" on page_visits
  for select to authenticated using (is_admin());

create index if not exists page_visits_visited_at_idx on page_visits (visited_at);

-- Daily sales aggregate (paid/failed orders + revenue). security_invoker
-- delegates to the base orders RLS (admin_orders_read from 004).
create or replace view sales_daily_v as
  select
    date_trunc('day', created_at)::date as day,
    count(*) filter (where status = 'paid') as paid_orders,
    count(*) filter (where status = 'stock_failed') as failed_orders,
    coalesce(sum(total_cents) filter (where status = 'paid'), 0) as revenue_cents
  from orders
  group by 1;

-- Daily visits aggregate.
create or replace view visits_daily_v as
  select
    date_trunc('day', visited_at)::date as day,
    count(*) as visits
  from page_visits
  group by 1;

-- Top products by lifetime qty + revenue (respaldo; range-aware reads go to
-- order_items joined to orders in the app, see src/lib/analytics/queries.ts).
create or replace view top_products_v as
  select
    oi.product_slug as slug,
    oi.product_name as name,
    sum(oi.qty) as qty,
    coalesce(sum(oi.qty * oi.unit_price_cents), 0) as revenue_cents
  from order_items oi
  group by oi.product_slug, oi.product_name;

-- Revenue by category (respaldo; range-aware reads join orders in the app).
create or replace view sales_by_category_v as
  select
    c.name as category_name,
    coalesce(sum(oi.qty * oi.unit_price_cents), 0) as revenue_cents
  from order_items oi
  join products p on p.slug = oi.product_slug
  join categories c on c.id = p.category_id
  group by c.name;

-- Guarantee the VIEWs respect the base tables' RLS (admin only).
alter view sales_daily_v set (security_invoker = true);
alter view visits_daily_v set (security_invoker = true);
alter view top_products_v set (security_invoker = true);
alter view sales_by_category_v set (security_invoker = true);
