
-- Create table if not exists
create table if not exists public.gallery_images (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text,
    category text,
    image_url text not null
);

-- Enable RLS
alter table public.gallery_images enable row level security;

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- DROP EXISTING POLICIES TO AVOID CONFLICTS --

-- Table policies
drop policy if exists "Public can view gallery images" on public.gallery_images;
drop policy if exists "Admins can insert gallery images" on public.gallery_images;
drop policy if exists "Admins can update gallery images" on public.gallery_images;
drop policy if exists "Admins can delete gallery images" on public.gallery_images;

-- Storage policies
drop policy if exists "Public can view gallery images" on storage.objects;
drop policy if exists "Authenticated users can upload gallery images" on storage.objects;
drop policy if exists "Authenticated users can update gallery images" on storage.objects;
drop policy if exists "Authenticated users can delete gallery images" on storage.objects;

-- RE-CREATE POLICIES --

-- Table policies
create policy "Public can view gallery images"
    on public.gallery_images for select
    using (true);

create policy "Admins can insert gallery images"
    on public.gallery_images for insert
    with check (true);

create policy "Admins can update gallery images"
    on public.gallery_images for update
    using (true);

create policy "Admins can delete gallery images"
    on public.gallery_images for delete
    using (true);

-- Storage policies
create policy "Public can view gallery images"
  on storage.objects for select
  using ( bucket_id = 'gallery' );

create policy "Authenticated users can upload gallery images"
  on storage.objects for insert
  with check ( bucket_id = 'gallery' );

create policy "Authenticated users can update gallery images"
  on storage.objects for update
  using ( bucket_id = 'gallery' );

create policy "Authenticated users can delete gallery images"
  on storage.objects for delete
  using ( bucket_id = 'gallery' );
