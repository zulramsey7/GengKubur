-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  location TEXT NOT NULL,
  notes TEXT,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  package_price NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL, -- pending, confirmed, completed, cancelled
  payment_proof_url TEXT,
  order_id TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert bookings
CREATE POLICY "Anyone can insert bookings" 
ON bookings FOR INSERT 
WITH CHECK (true);

-- Allow anyone to read bookings (for now, to simplify admin access without auth)
-- In production, this should be restricted to admins
CREATE POLICY "Anyone can view bookings" 
ON bookings FOR SELECT 
USING (true);

-- Allow anyone to update bookings (e.g. for uploading payment proof or admin status update)
-- In production, this should be restricted
CREATE POLICY "Anyone can update bookings" 
ON bookings FOR UPDATE 
USING (true);
