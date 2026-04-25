-- Create a table for public profiles
create table if not exists profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  username text unique,
  full_name text,
  avatar_url text,
  role text default 'user' check (role in ('user', 'admin'))
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update bookings table security
-- First, drop existing policies to avoid conflicts
drop policy if exists "Anyone can view bookings" on bookings;
drop policy if exists "Anyone can insert bookings" on bookings;

-- Allow anyone to insert (make a booking)
create policy "Anyone can insert bookings" 
on bookings for insert 
with check (true);

-- Only admins can view all bookings
create policy "Admins can view all bookings" 
on bookings for select 
using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid()
    and profiles.role = 'admin'
  )
);
