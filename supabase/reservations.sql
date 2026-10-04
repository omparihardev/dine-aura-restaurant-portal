-- ==============================================================================
-- DineAura: Table Reservation & Inquiry System
-- Migration Script: public.reservations table, constraints, triggers, and RLS
-- ==============================================================================
-- Instructions:
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. RESERVATIONS TABLE
create table if not exists public.reservations (
    id uuid primary key default gen_random_uuid(),
    restaurant_id uuid not null references public.restaurants(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    customer_name text not null check (length(trim(customer_name)) > 0),
    customer_phone text not null check (length(trim(customer_phone)) > 0),
    reservation_date date not null,
    reservation_time time not null,
    party_size integer not null check (party_size >= 1),
    seating_preference text,
    special_request text,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'declined', 'cancelled', 'completed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. INDEXES
create index if not exists idx_reservations_restaurant_id on public.reservations (restaurant_id);
create index if not exists idx_reservations_user_id on public.reservations (user_id);
create index if not exists idx_reservations_status on public.reservations (status);
create index if not exists idx_reservations_date on public.reservations (reservation_date);

-- 3. UPDATED_AT TRIGGER
-- Uses existing handle_updated_at() trigger function from schema.sql
drop trigger if exists trg_reservations_updated_at on public.reservations;
create trigger trg_reservations_updated_at
    before update on public.reservations
    for each row
    execute function public.handle_updated_at();

-- 4. ROW LEVEL SECURITY (RLS)
alter table public.reservations enable row level security;

-- ------------------------------------------------------------------------------
-- Reservations Policies
-- ------------------------------------------------------------------------------

-- Customer can insert their own reservation
drop policy if exists "Users can insert their own reservations" on public.reservations;
create policy "Users can insert their own reservations"
    on public.reservations
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Customer can select their own reservations; Admin can select all
drop policy if exists "Users can view own reservations or admin all" on public.reservations;
create policy "Users can view own reservations or admin all"
    on public.reservations
    for select
    to authenticated
    using (auth.uid() = user_id or public.is_admin());

-- Customer can cancel their own pending reservations; Admin can update any reservation
drop policy if exists "Users can cancel own pending reservations or admin update all" on public.reservations;
create policy "Users can cancel own pending reservations or admin update all"
    on public.reservations
    for update
    to authenticated
    using (
        (auth.uid() = user_id and status = 'pending')
        or public.is_admin()
    )
    with check (
        (auth.uid() = user_id and status = 'cancelled')
        or public.is_admin()
    );

-- Admin can delete reservations if needed
drop policy if exists "Admins can delete reservations" on public.reservations;
create policy "Admins can delete reservations"
    on public.reservations
    for delete
    to authenticated
    using (public.is_admin());
