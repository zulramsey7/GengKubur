-- Update the payment-proofs bucket to be public
update storage.buckets
set public = true
where id = 'payment-proofs';

-- Ensure the policy allows public access (just to be safe)
drop policy if exists "Anyone can view payment proofs" on storage.objects;
create policy "Anyone can view payment proofs"
on storage.objects for select
using (bucket_id = 'payment-proofs');
