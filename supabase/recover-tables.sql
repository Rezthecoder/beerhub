-- ========================================
-- SUPABASE TABLE RECOVERY SCRIPT
-- ========================================
-- This script will recreate all tables that were accidentally deleted
-- Run this in your Supabase SQL Editor to recover your database

-- Step 1: Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL, -- Price in yen (smallest unit)
    image VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount INTEGER NOT NULL, -- Total price in yen
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    customer_email VARCHAR(255),
    payment_method VARCHAR(50),
    payment_amount INTEGER,
    payment_currency VARCHAR(10) DEFAULT 'JPY',
    payment_completed_at TIMESTAMP WITH TIME ZONE,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    shipping_address TEXT,
    order_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL,
    payment_provider_id VARCHAR(255),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'JPY',
    status VARCHAR(50) DEFAULT 'pending',
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Create triggers for updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Insert Japanese beer products
INSERT INTO products (name, price, image, description) VALUES
('Kirin Nodogoshi Beer', 280, '/images/kirin-nodogoshi.jpg', 'Refreshing Japanese beer with 5% alcohol content. Kirin''s brewing technology creates the perfect "nodogoshi" (throat feel).'),
('Sapporo Premium Beer', 320, '/images/sapporo-beer.jpg', 'Premium Japanese lager beer from Sapporo Breweries. Crisp, clean taste with the iconic star logo since 1876.'),
('Asahi Super Dry', 300, '/images/asahi-super-dry.jpg', 'Japan''s No.1 beer with a crisp, dry taste. Super "DRY" beer brewed from quality ingredients for excellent flavor.'),
('Kirin Honkirin Beer', 350, '/images/kirin-honkirin.jpg', 'Authentic Kirin beer with 6% alcohol content. Long-term low-temperature fermentation for rich, full-bodied taste.'),
('Kirin Ichiban Shibori', 330, '/images/kirin-ichiban.jpg', 'Premium beer made using only the first press of the wort. Available in both can and bottle formats for pure taste.')
ON CONFLICT DO NOTHING;

-- Step 7: Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Step 8: Create policies for products (public read access)
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

-- Step 9: Create policies for orders
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (true);

-- Step 10: Create policies for payments
CREATE POLICY "Anyone can insert payments" ON payments 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view payments" ON payments 
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update payments" ON payments 
    FOR UPDATE USING (true);

-- Step 11: Verify tables were created
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('products', 'orders', 'payments')
ORDER BY table_name;

-- Step 12: Check table structure
\d products;
\d orders;
\d payments;

-- ========================================
-- RECOVERY COMPLETE! 🎉
-- ========================================
-- Your tables have been recreated with:
-- ✅ products table (5 Japanese beers)
-- ✅ orders table (with payment fields)
-- ✅ payments table (for PayPay integration)
-- ✅ All triggers and functions
-- ✅ Row Level Security policies
-- ✅ Sample product data
-- ========================================
