-- Add additional_items column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS additional_items JSONB DEFAULT '[]'::jsonb;
