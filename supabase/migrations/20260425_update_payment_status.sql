-- Update bookings table for BayarCash integration
-- Add new payment statuses and payment methods

-- Add updated_at column for tracking
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Update status column to support new statuses
-- First, create a check constraint for valid statuses
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'pending_payment', 'payment_failed', 'confirmed', 'in_progress', 'completed', 'cancelled'));

-- Update payment_method column to support new payment methods
-- First, update existing data to valid values
UPDATE bookings 
SET payment_method = 'manual_transfer' 
WHERE payment_method IS NOT NULL 
AND payment_method NOT IN ('cash', 'manual_transfer', 'bayarcash');

-- Then, create a check constraint for valid payment methods
ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_payment_method_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_payment_method_check 
CHECK (payment_method IN ('cash', 'manual_transfer', 'bayarcash') OR payment_method IS NULL);

-- Add comment to document the new statuses
COMMENT ON COLUMN bookings.status IS 'Booking status: pending, pending_payment (waiting for BayarCash), payment_failed, confirmed, in_progress, completed, cancelled';

COMMENT ON COLUMN bookings.payment_method IS 'Payment method: cash, manual_transfer (bank transfer), bayarcash (payment gateway)';
