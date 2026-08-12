-- 002_catalog_search: denormalized catalog view backing the storefront queries.
-- It aggregates per-product stock and available sizes so filtering (talla,
-- av) and pagination run at the database level instead of in the application.
--
-- security_invoker makes the base-table RLS (which uses FORCE) evaluate for
-- the calling user; public readers therefore still only see published rows.

create view catalog_products_v
with (security_invoker = true)
as
select
  p.id,
  p.slug,
  p.name,
  p.description,
  p.price_cents,
  p.category_id,
  c.slug as category_slug,
  c.name as category_name,
  p.images,
  p.published_at,
  coalesce(p.published_at, p.created_at) as published_sort,
  coalesce(sum(ps.stock), 0)::int as stock_total,
  coalesce(
    array_agg(ps.size order by ps.sort_order) filter (where ps.stock > 0),
    '{}'::text[]
  ) as available_sizes
from products p
join categories c on c.id = p.category_id
left join product_sizes ps on ps.product_id = p.id
where p.status = 'published'
group by
  p.id, p.slug, p.name, p.description, p.price_cents, p.category_id,
  c.slug, c.name, p.images, p.published_at, p.created_at;

grant select on catalog_products_v to anon, authenticated;
