-- Add admin_remarks column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS admin_remarks TEXT;
