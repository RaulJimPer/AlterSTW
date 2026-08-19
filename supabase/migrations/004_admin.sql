-- 004_admin: admin identity and RLS policies for the admin panel (feature 004).
-- Authoritative source: spec/features/004-admin-inventory-products/plan.md
-- Adds the admin_users membership table, the is_admin() guard and admin
-- policies over the catalog (full CRUD), orders (select only) and the
-- product-images Storage bucket. 003_orders.sql is NOT touched; the public
-- read policies from 001 remain unchanged.
-- Idempotent (drop/create + create if not exists) so the whole file can be
-- re-run safely if a previous run failed partway in the SQL editor.

-- Admin identity: the owner grants access by inserting a row here (dashboard
-- or SQL editor). No API writes; self-read only.
create table if not exists admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table admin_users force row level security;

drop policy if exists "admin_users_self_read" on admin_users;
create policy "admin_users_self_read" on admin_users
  for select to authenticated using (auth.uid() = user_id);

-- is_admin(): security definer bypasses the admin_users RLS (no recursion);
-- stable so storage policies may call it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Admin CRUD over the catalog. The public read policies from 001 stay intact.
drop policy if exists "admin_categories_all" on categories;
create policy "admin_categories_all" on categories
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "admin_products_all" on products;
create policy "admin_products_all" on products
  for all to authenticated using (is_admin()) with check (is_admin());
drop policy if exists "admin_product_sizes_all" on product_sizes;
create policy "admin_product_sizes_all" on product_sizes
  for all to authenticated using (is_admin()) with check (is_admin());

-- Admin read of orders (never writes; the Stripe webhook stays the only
-- writer). Analytics (005) will reuse this port.
drop policy if exists "admin_orders_read" on orders;
create policy "admin_orders_read" on orders
  for select to authenticated using (is_admin());
drop policy if exists "admin_order_items_read" on order_items;
create policy "admin_order_items_read" on order_items
  for select to authenticated using (is_admin());

-- Storage: public bucket for product images; public read (storefront),
-- write only for admins. Postgres allows only ONE command after FOR (or ALL),
-- so the admin policy uses FOR ALL: the extra SELECT for admins is harmless
-- because the public read policy below already lets everyone read the bucket.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product_images_public_read" on storage.objects;
create policy "product_images_public_read" on storage.objects
  for select to public using (bucket_id = 'product-images');

drop policy if exists "product_images_admin_write" on storage.objects;
create policy "product_images_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and is_admin())
  with check (bucket_id = 'product-images' and is_admin());