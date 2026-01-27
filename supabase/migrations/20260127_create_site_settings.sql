-- Create site_settings table
create table if not exists public.site_settings (
  key text primary key,
  value text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.site_settings enable row level security;

-- Create policies
create policy "Public can view site settings"
  on public.site_settings for select
  using (true);

create policy "Admins can insert site settings"
  on public.site_settings for insert
  with check (auth.role() = 'authenticated');

create policy "Admins can update site settings"
  on public.site_settings for update
  using (auth.role() = 'authenticated');

-- Insert default music setting
insert into public.site_settings (key, value)
values ('background_music_url', 'https://youtu.be/_EvTz5qH8HU')
on conflict (key) do nothing;
