-- Add before and after photo columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS before_photo_url TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS after_photo_url TEXT;

-- Create a storage bucket for proof of work photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proof_of_work', 'proof_of_work', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to proof_of_work bucket
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'proof_of_work' );

CREATE POLICY "Public Insert" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'proof_of_work' );

CREATE POLICY "Public Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'proof_of_work' );
