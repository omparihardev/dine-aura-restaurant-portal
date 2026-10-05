-- ==============================================================================
-- DineAura: Restaurant Menu Feature (Additive Migration)
-- Migration Script: public.restaurant_menu_items table, constraints, indexes,
--                   updated_at trigger, and Row Level Security (RLS) policies.
-- ==============================================================================
-- Notice:
-- This is an ADDITIVE feature table. It does not modify, rename, or drop any
-- existing tables, columns, constraints, or policies in the DineAura database.
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. RESTAURANT MENU ITEMS TABLE
create table if not exists public.restaurant_menu_items (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    name text not null,
    description text,
    category text not null,
    price numeric(10, 2) not null,
    is_available boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Constraints
    constraint chk_menu_items_price_non_negative check (price >= 0),
    constraint chk_menu_items_name_not_empty check (length(trim(name)) > 0),
    constraint chk_menu_items_category_not_empty check (length(trim(category)) > 0)
);

-- Table and column documentation comments
comment on table public.restaurant_menu_items is 'Additive table storing menu items for DineAura restaurants.';
comment on column public.restaurant_menu_items.id is 'Unique identifier for the menu item.';
comment on column public.restaurant_menu_items.restaurant_id is 'Foreign key referencing public.restaurants(id). Cascades on deletion.';
comment on column public.restaurant_menu_items.name is 'Name of the menu item (cannot be empty or whitespace only).';
comment on column public.restaurant_menu_items.description is 'Optional culinary description or ingredients.';
comment on column public.restaurant_menu_items.category is 'Category of the dish (e.g. Starters, Main Course, Desserts, Beverages).';
comment on column public.restaurant_menu_items.price is 'Price in INR (₹) with up to 2 decimal places (must be non-negative).';
comment on column public.restaurant_menu_items.is_available is 'Availability flag indicating whether the item can currently be ordered.';

-- 2. INDEXES
-- Index for foreign key lookups by restaurant
create index if not exists idx_menu_items_restaurant_id
    on public.restaurant_menu_items (restaurant_id);

-- Composite index optimized for querying available menu items for a specific restaurant
create index if not exists idx_menu_items_restaurant_available
    on public.restaurant_menu_items (restaurant_id, is_available);

-- Additional index on category for menu section grouping
create index if not exists idx_menu_items_category
    on public.restaurant_menu_items (category);

-- 3. UPDATED_AT TRIGGER
-- Reuses the existing public.handle_updated_at() trigger function defined in schema.sql
drop trigger if exists trg_restaurant_menu_items_updated_at on public.restaurant_menu_items;
create trigger trg_restaurant_menu_items_updated_at
    before update on public.restaurant_menu_items
    for each row
    execute function public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.restaurant_menu_items enable row level security;

-- ------------------------------------------------------------------------------
-- Menu Items RLS Policies
-- ------------------------------------------------------------------------------

-- SELECT: Authenticated users can view menu items
drop policy if exists "Authenticated users can view menu items" on public.restaurant_menu_items;
create policy "Authenticated users can view menu items"
    on public.restaurant_menu_items
    for select
    to authenticated
    using (true);

-- INSERT: Only admin users can insert menu items (reusing existing public.is_admin())
drop policy if exists "Admins can insert menu items" on public.restaurant_menu_items;
create policy "Admins can insert menu items"
    on public.restaurant_menu_items
    for insert
    to authenticated
    with check (public.is_admin());

-- UPDATE: Only admin users can update menu items (reusing existing public.is_admin())
drop policy if exists "Admins can update menu items" on public.restaurant_menu_items;
create policy "Admins can update menu items"
    on public.restaurant_menu_items
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- DELETE: Only admin users can delete menu items (reusing existing public.is_admin())
drop policy if exists "Admins can delete menu items" on public.restaurant_menu_items;
create policy "Admins can delete menu items"
    on public.restaurant_menu_items
    for delete
    to authenticated
    using (public.is_admin());
