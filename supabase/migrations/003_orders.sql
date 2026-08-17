-- 003_orders: order schema for the ALTERSTW checkout .
-- Authoritative source: spec/features/003-checkout-payments/plan.md
-- Only the Stripe webhook writes these tables (service role). There are NO
-- anon/authenticated policies in 003: FORCE RLS blocks every public read and
-- write; admin reads arrive in feature 004 (004_admin_orders_read migration,
-- never editing this file).
--
-- Idempotency: orders.checkout_session_id is unique, so replaying a webhook
-- cannot create duplicate orders/items.
-- Money is integer cents; email_status tracks the best-effort Resend
-- confirmation email.

create type order_status as enum ('paid', 'stock_failed');
create type email_status as enum ('pending', 'sent', 'failed');

create table orders (
  id bigint generated always as identity primary key,
  checkout_session_id text unique not null,
  customer_email text,
  status order_status not null default 'paid',
  email_status email_status not null default 'pending',
  email_sent_at timestamptz,
  subtotal_cents int not null check (subtotal_cents >= 0),
  tax_cents int not null default 0 check (tax_cents >= 0),
  shipping_cents int not null default 0 check (shipping_cents >= 0),
  total_cents int not null check (total_cents >= 0),
  created_at timestamptz not null default now()
);

create table order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references orders(id) on delete cascade,
  product_slug text not null,
  product_name text not null,
  size text not null,
  qty int not null check (qty > 0),
  unit_price_cents int not null check (unit_price_cents >= 0),
  unique (order_id, product_slug, size)
);

create index order_items_order_id_idx on order_items (order_id);

alter table orders force row level security;
alter table order_items force row level security;

-- record_checkout_payment: single, atomic writer consumed by the Stripe
-- webhook. Verifies every line has stock first (locking the size rows so
-- concurrent sessions cannot over-sell), then inserts the order and items and
-- decrements stock in the same transaction. Replaying an already-recorded
-- session is a no-op (idempotency); on stock failure nothing is decremented
-- and order_items still record what was charged (for admin/analytics).
create or replace function record_checkout_payment(
  p_checkout_session_id text,
  p_customer_email text,
  p_subtotal_cents int,
  p_tax_cents int,
  p_shipping_cents int,
  p_total_cents int,
  p_lines jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id bigint;
  v_line jsonb;
  v_product_id bigint;
  v_has_stock boolean := true;
begin
  -- Idempotency: a replay of the same session must not duplicate anything.
  if exists (select 1 from orders where checkout_session_id = p_checkout_session_id) then
    return 'exists';
  end if;

  -- Phase 1: lock and verify every line before touching anything; a missing
  -- product or size, or a size without enough stock, fails the whole order.
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    select id into v_product_id
      from products
      where slug = v_line->>'product_slug';
    if v_product_id is null then
      v_has_stock := false;
    else
      perform 1
        from product_sizes
        where product_id = v_product_id
          and size = v_line->>'size'
          and stock >= (v_line->>'qty')::int
        for update;
      if not found then
        v_has_stock := false;
      end if;
    end if;
  end loop;

  -- Phase 2: single insert that also carries the status decided in phase 1.
  insert into orders (
    checkout_session_id, customer_email, status,
    subtotal_cents, tax_cents, shipping_cents, total_cents
  )
  values (
    p_checkout_session_id, p_customer_email,
    case when v_has_stock then 'paid'::order_status else 'stock_failed'::order_status end,
    p_subtotal_cents, p_tax_cents, p_shipping_cents, p_total_cents
  )
  returning id into v_order_id;

  -- Phase 3: items always record what was charged; stock is only decremented
  -- when every line had enough, never partially.
  for v_line in select * from jsonb_array_elements(p_lines)
  loop
    insert into order_items (order_id, product_slug, product_name, size, qty, unit_price_cents)
    values (
      v_order_id,
      v_line->>'product_slug',
      v_line->>'product_name',
      v_line->>'size',
      (v_line->>'qty')::int,
      (v_line->>'unit_price_cents')::int
    );
    if v_has_stock then
      select id into v_product_id
        from products
        where slug = v_line->>'product_slug';
      update product_sizes
        set stock = stock - (v_line->>'qty')::int
        where product_id = v_product_id and size = v_line->>'size';
    end if;
  end loop;

  return case when v_has_stock then 'paid' else 'stock_failed' end;
end;
$$;

revoke all on function record_checkout_payment(text, text, int, int, int, int, jsonb) from public;
grant execute on function record_checkout_payment(text, text, int, int, int, int, jsonb) to service_role;