-- ==============================================================================
-- DineAura: Supabase Storage Configuration for Restaurant Images
-- Bucket Name: restaurant-images (Public)
-- ==============================================================================
-- Run this script in the Supabase Dashboard SQL Editor (https://supabase.com/dashboard)
-- 
-- This script:
-- 1. Creates a public bucket named 'restaurant-images' with 5MB max file size
--    and restricts allowed MIME types to JPG, PNG, and WebP.
-- 2. Configures Storage RLS policies so that:
--    - Anyone (public) can read/view the images.
--    - ONLY authenticated administrators can upload, update, or delete images.
-- ==============================================================================

-- 0. Ensure public.is_admin() exists so policies evaluate safely
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

-- 1. Create the 'restaurant-images' bucket if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'restaurant-images',
    'restaurant-images',
    true,
    5242880, -- 5 MB limit in bytes
    array['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
on conflict (id) do update set
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 2. Storage RLS Policies for 'restaurant-images'

-- Policy A: Anyone can view restaurant images (public access)
drop policy if exists "Restaurant images are publicly accessible" on storage.objects;
create policy "Restaurant images are publicly accessible"
    on storage.objects
    for select
    to public
    using (bucket_id = 'restaurant-images');

-- Policy B: Only authenticated administrators can upload images
drop policy if exists "Admins can upload restaurant images" on storage.objects;
create policy "Admins can upload restaurant images"
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'restaurant-images'
        and public.is_admin()
    );

-- Policy C: Only authenticated administrators can update images
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

-- Policy D: Only authenticated administrators can delete images
drop policy if exists "Admins can delete restaurant images" on storage.objects;
create policy "Admins can delete restaurant images"
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'restaurant-images'
        and public.is_admin()
    );

-- Verification
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'restaurant-images';
