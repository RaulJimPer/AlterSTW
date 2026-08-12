-- 001_catalog: catalog schema for the ALTERSTW storefront
-- Authoritative source: spec/features/001-product-catalog/data-model.md
-- Money is integer cents; ids are bigint identity; timestamps are timestamptz.
-- Every table enforces Row Level Security; the public (anon) role only reads
-- published catalog data. Writes are reserved to the service role (seed
-- scripts) until feature 004 introduces admin policies.

create type product_status as enum ('draft', 'published');

create table categories (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  sort_order int not null default 0
);

create table products (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  description text not null default '',
  price_cents int not null check (price_cents >= 0),
  category_id bigint not null references categories(id),
  images text[] not null default '{}',
  status product_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_sizes (
  id bigint generated always as identity primary key,
  product_id bigint not null references products(id) on delete cascade,
  size text not null,
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0,
  unique (product_id, size)
);

create index products_category_id_idx on products (category_id);
create index products_published_idx on products (status) where status = 'published';
create index product_sizes_product_id_idx on product_sizes (product_id);

alter table categories force row level security;
alter table products force row level security;
alter table product_sizes force row level security;

-- Public reads: categories are always visible.
create policy "categories_public_read" on categories
  for select to anon, authenticated
  using (true);

-- Public reads: only published products.
create policy "products_public_read" on products
  for select to anon, authenticated
  using (status = 'published');

-- Public reads: sizes only if the parent product is published.
create policy "product_sizes_public_read" on product_sizes
  for select to anon, authenticated
  using (exists (
    select 1 from products p
    where p.id = product_id and p.status = 'published'
  ));
