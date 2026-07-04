-- =====================================================================
-- PrintOnGo — Complete Database Schema
-- =====================================================================
-- Reference schema for the PrintOnGo app.
-- Paste into the Supabase SQL Editor to replicate the database.
--
-- Note: The `supabase/migrations/` directory in this project is managed
-- by Lovable Cloud's migration tool and cannot be edited directly, so
-- this file lives at `supabase/schema.sql` as the canonical reference.
--
-- Tables: products, orders, order_items
-- Includes enums, updated_at triggers, GRANTs, and RLS policies.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------
do $$ begin
  create type public.order_status as enum (
    'pending',
    'confirmed',
    'printing',
    'out_for_delivery',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- Shared: updated_at trigger function
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- 1. PRODUCTS
-- =====================================================================
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text,
  price        numeric(10,2) not null check (price >= 0),
  image_url    text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

grant select on public.products to anon, authenticated;
grant all on public.products to service_role;

alter table public.products enable row level security;

drop policy if exists "Products are publicly viewable" on public.products;
create policy "Products are publicly viewable"
  on public.products for select
  to anon, authenticated
  using (is_active = true);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 2. ORDERS
-- =====================================================================
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete set null,
  customer_name     text not null,
  customer_phone    text not null,
  customer_email    text,
  delivery_address  text not null,
  delivery_lat      double precision,
  delivery_lng      double precision,
  distance_km       numeric(6,2),
  subtotal          numeric(10,2) not null default 0 check (subtotal >= 0),
  delivery_fee      numeric(10,2) not null default 0 check (delivery_fee >= 0),
  total             numeric(10,2) not null default 0 check (total >= 0),
  status            public.order_status not null default 'pending',
  courier_lat       double precision,
  courier_lng       double precision,
  courier_updated_at timestamptz,
  estimated_arrival timestamptz,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Enable Supabase Realtime on orders so the Live Tracking Map updates
-- instantly when status / courier coordinates change.
do $$ begin
  perform 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders';
  if not found then
    execute 'alter publication supabase_realtime add table public.orders';
  end if;
end $$;
alter table public.orders replica identity full;

create index if not exists orders_user_id_idx    on public.orders(user_id);
create index if not exists orders_status_idx     on public.orders(status);
create index if not exists orders_created_at_idx on public.orders(created_at desc);

grant select, insert, update on public.orders to authenticated;
grant insert on public.orders to anon;            -- guest checkout
grant all    on public.orders to service_role;

alter table public.orders enable row level security;

drop policy if exists "Users can view their own orders" on public.orders;
create policy "Users can view their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own orders" on public.orders;
create policy "Users can insert their own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Guests can place orders" on public.orders;
create policy "Guests can place orders"
  on public.orders for insert
  to anon
  with check (user_id is null);

drop policy if exists "Users can update their own pending orders" on public.orders;
create policy "Users can update their own pending orders"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 3. ORDER ITEMS  (per-document line items for a print order)
-- =====================================================================
create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  file_name      text,
  pages          integer not null default 1 check (pages >= 0),
  copies         integer not null default 1 check (copies >= 1),
  color          boolean not null default false,
  staple         boolean not null default false,
  spiral         boolean not null default false,
  binding_type   text,          -- 'plastic' | 'metal' | null
  unit_price     numeric(10,2) not null default 0 check (unit_price >= 0),
  line_total     numeric(10,2) not null default 0 check (line_total >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items(order_id);

grant select, insert on public.order_items to authenticated;
grant insert           on public.order_items to anon;
grant all              on public.order_items to service_role;

alter table public.order_items enable row level security;

drop policy if exists "Users can view items from their orders" on public.order_items;
create policy "Users can view items from their orders"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert items into their orders" on public.order_items;
create policy "Users can insert items into their orders"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id = auth.uid()
    )
  );

drop policy if exists "Guests can insert items into guest orders" on public.order_items;
create policy "Guests can insert items into guest orders"
  on public.order_items for insert
  to anon
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and o.user_id is null
    )
  );

-- =====================================================================
-- End of schema
-- =====================================================================
