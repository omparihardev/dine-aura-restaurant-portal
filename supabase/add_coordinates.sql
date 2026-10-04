-- ==============================================================================
-- DineAura: Add exact geographic coordinates to public.restaurants
-- Migration: Add latitude and longitude columns with geographic bounds
-- ==============================================================================
-- Instructions:
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

alter table public.restaurants
    add column if not exists latitude numeric(10, 7) check (latitude >= -90 and latitude <= 90),
    add column if not exists longitude numeric(10, 7) check (longitude >= -180 and longitude <= 180);

-- Index for coordinate queries (sparse index only for restaurants with coordinates)
create index if not exists idx_restaurants_coordinates
    on public.restaurants (latitude, longitude)
    where latitude is not null and longitude is not null;
