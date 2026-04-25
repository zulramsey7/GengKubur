-- Create a bucket for payment proofs if it doesn't exist
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', true)
on conflict (id) do update
set public = true;

-- Drop existing policies to avoid conflicts/duplicates
drop policy if exists "Anyone can upload payment proofs" on storage.objects;
drop policy if exists "Anyone can view payment proofs" on storage.objects;
drop policy if exists "Authenticated users can upload payment proofs" on storage.objects;

-- Create policy to allow anyone (including unauthenticated users) to upload
create policy "Anyone can upload payment proofs"
on storage.objects for insert
with check ( bucket_id = 'payment-proofs' );

-- Create policy to allow anyone to view
create policy "Anyone can view payment proofs"
on storage.objects for select
using ( bucket_id = 'payment-proofs' );
