-- Allow anyone to delete bookings (simplification for development as requested)
-- In production, this should be restricted to admins
CREATE POLICY "Anyone can delete bookings" 
ON bookings FOR DELETE 
USING (true);
