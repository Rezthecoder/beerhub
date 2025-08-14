-- Add more detailed payment tracking columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_amount INTEGER;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_currency VARCHAR(10) DEFAULT 'JPY';
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS order_notes TEXT;
-- Create a separate payments table for detailed payment tracking
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    -- 'stripe', 'paypay', etc.
    payment_provider_id VARCHAR(255),
    -- Stripe session ID, PayPay payment ID, etc.
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'JPY',
    status VARCHAR(50) DEFAULT 'pending',
    -- 'pending', 'completed', 'failed', 'refunded'
    provider_response JSONB,
    -- Store full response from payment provider
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Enable RLS for payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- Create policies for payments
CREATE POLICY "Anyone can insert payments" ON payments FOR
INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view payments" ON payments FOR
SELECT USING (true);
CREATE POLICY "Anyone can update payments" ON payments FOR
UPDATE USING (true);
-- Create trigger for payments updated_at
CREATE TRIGGER update_payments_updated_at BEFORE
UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();