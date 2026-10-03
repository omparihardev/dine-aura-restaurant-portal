-- ==============================================================================
-- DineAura: Supabase Database Schema & Migration
-- ==============================================================================

-- 1. PROFILES TABLE
-- References auth.users(id). Passwords are never stored here.
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text,
    email text,
    phone text,
    avatar_url text,
    role text not null default 'user' check (role in ('user', 'admin')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. CATEGORIES TABLE
create table if not exists public.categories (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    created_at timestamptz not null default now()
);

-- 3. RESTAURANTS TABLE
create table if not exists public.restaurants (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    description text,
    city text not null,
    state text not null,
    address text,
    cuisine text,
    image_url text,
    phone text,
    rating numeric check (rating >= 0 and rating <= 5),
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ==============================================================================
-- INDEXES
-- Optimize restaurant search by city, state, cuisine, and active status
-- ==============================================================================
create index if not exists idx_restaurants_city on public.restaurants (city);
create index if not exists idx_restaurants_state on public.restaurants (state);
create index if not exists idx_restaurants_cuisine on public.restaurants (cuisine);
create index if not exists idx_restaurants_is_active on public.restaurants (is_active);

-- ==============================================================================
-- HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- Admin verification helper (security definer avoids RLS recursion on profiles)
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
          and role = 'admin'
    );
$$;

-- Trigger function: Update timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

-- updated_at triggers
drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

drop trigger if exists trg_restaurants_updated_at on public.restaurants;
create trigger trg_restaurants_updated_at
    before update on public.restaurants
    for each row
    execute function public.handle_updated_at();

-- Trigger function: Prevent non-admin users from escalating/modifying their role
create or replace function public.prevent_profile_role_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Prevent role escalation by normal authenticated users while allowing:
    -- 1. Existing admins (public.is_admin())
    -- 2. Supabase service_role operations (auth.role() = 'service_role')
    -- 3. Direct database administrator executions in SQL Editor (auth.uid() is null)
    if new.role is distinct from old.role 
       and auth.uid() is not null
       and not public.is_admin() 
       and coalesce(auth.jwt()->>'role', auth.role(), '') <> 'service_role' then
        raise exception 'Users are not permitted to change their own role.';
    end if;
    return new;
end;
$$;

drop trigger if exists trg_prevent_profile_role_update on public.profiles;
create trigger trg_prevent_profile_role_update
    before update on public.profiles
    for each row
    execute function public.prevent_profile_role_update();

-- Trigger function: Automatically create a profile when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, email, phone, avatar_url, role)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        new.email,
        new.phone,
        coalesce(new.raw_user_meta_data->>'avatar_url', ''),
        'user'
    );
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.restaurants enable row level security;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
-- Users can read their own profile; admins can read any profile
drop policy if exists "Profiles are viewable by owner or admin" on public.profiles;
create policy "Profiles are viewable by owner or admin"
    on public.profiles
    for select
    to authenticated
    using (auth.uid() = id or public.is_admin());

-- Users can update their own profile; admins can update any profile
drop policy if exists "Profiles can be updated by owner or admin" on public.profiles;
create policy "Profiles can be updated by owner or admin"
    on public.profiles
    for update
    to authenticated
    using (auth.uid() = id or public.is_admin())
    with check (auth.uid() = id or public.is_admin());

-- ------------------------------------------------------------------------------
-- Categories Policies
-- ------------------------------------------------------------------------------
-- Public and authenticated users can view categories
drop policy if exists "Categories are viewable by everyone" on public.categories;
create policy "Categories are viewable by everyone"
    on public.categories
    for select
    to public
    using (true);

-- Only admins can insert categories
drop policy if exists "Categories can be inserted by admins only" on public.categories;
create policy "Categories can be inserted by admins only"
    on public.categories
    for insert
    to authenticated
    with check (public.is_admin());

-- Only admins can update categories
drop policy if exists "Categories can be updated by admins only" on public.categories;
create policy "Categories can be updated by admins only"
    on public.categories
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Only admins can delete categories
drop policy if exists "Categories can be deleted by admins only" on public.categories;
create policy "Categories can be deleted by admins only"
    on public.categories
    for delete
    to authenticated
    using (public.is_admin());

-- ------------------------------------------------------------------------------
-- Restaurants Policies
-- ------------------------------------------------------------------------------
-- Public and authenticated users can read active restaurants; admins can view all
drop policy if exists "Active restaurants are viewable by everyone" on public.restaurants;
create policy "Active restaurants are viewable by everyone"
    on public.restaurants
    for select
    to public
    using (is_active = true or public.is_admin());

-- Only admins can insert restaurants
drop policy if exists "Restaurants can be inserted by admins only" on public.restaurants;
create policy "Restaurants can be inserted by admins only"
    on public.restaurants
    for insert
    to authenticated
    with check (public.is_admin());

-- Only admins can update restaurants
drop policy if exists "Restaurants can be updated by admins only" on public.restaurants;
create policy "Restaurants can be updated by admins only"
    on public.restaurants
    for update
    to authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- Only admins can delete restaurants
drop policy if exists "Restaurants can be deleted by admins only" on public.restaurants;
create policy "Restaurants can be deleted by admins only"
    on public.restaurants
    for delete
    to authenticated
    using (public.is_admin());

-- ==============================================================================
-- SEED DATA: CATEGORIES
-- ==============================================================================
insert into public.categories (name, description)
values
    ('North Indian', 'Rich curries, tandoori breads, and fragrant gravies from Northern India.'),
    ('South Indian', 'Traditional dosas, idlis, vadas, sambar, and coconut-infused delicacies.'),
    ('Mughlai', 'Royal aromatic biryanis, kebabs, and rich kormas rooted in Mughal culinary tradition.'),
    ('Punjabi', 'Hearty and robust dishes including butter chicken, dal makhani, and stuffed parathas.'),
    ('Gujarati', 'Wholesome vegetarian thalis balancing sweet, salty, and spicy flavours.'),
    ('Rajasthani', 'Authentic heritage recipes such as dal baati churma and rich spicy curries.'),
    ('Bengali', 'Subtle mustard flavours, panch phoron spices, fresh river fish, and exquisite sweets.'),
    ('Street Food', 'Popular Indian chaat, panipuri, pav bhaji, rolls, and savoury snacks.'),
    ('Cafe', 'Artisanal coffees, teas, light bites, and contemporary casual fare.'),
    ('Fast Food', 'Quick bites, burgers, wraps, and Indo-Western comfort foods.')
on conflict (name) do nothing;

-- ==============================================================================
-- STORAGE: RESTAURANT IMAGES BUCKET & POLICIES
-- ==============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'restaurant-images',
    'restaurant-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

drop policy if exists "Restaurant images are publicly accessible" on storage.objects;
create policy "Restaurant images are publicly accessible"
    on storage.objects
    for select
    to public
    using (bucket_id = 'restaurant-images');

drop policy if exists "Admins can upload restaurant images" on storage.objects;
create policy "Admins can upload restaurant images"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'restaurant-images'
        and public.is_admin()
    );

drop policy if exists "Admins can update restaurant images" on storage.objects;
create policy "Admins can update restaurant images"
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'restaurant-images'
        and public.is_admin()
    )
    with check (
        bucket_id = 'restaurant-images'
        and public.is_admin()
    );

drop policy if exists "Admins can delete restaurant images" on storage.objects;
create policy "Admins can delete restaurant images"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'restaurant-images'
        and public.is_admin()
    );

