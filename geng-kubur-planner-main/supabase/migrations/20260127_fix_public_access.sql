-- Drop existing select policies to ensure clean state
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;
DROP POLICY IF EXISTS "Public can view bookings" ON bookings;

-- Create explicit public select policy
CREATE POLICY "Public can view bookings"
ON bookings FOR SELECT
TO public
USING (true);

-- Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
