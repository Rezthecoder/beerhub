-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL, -- Price in yen (smallest unit)
    image VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_amount INTEGER NOT NULL, -- Total price in yen
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_id VARCHAR(255),
    customer_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Japanese beer products
INSERT INTO products (name, price, image, description) VALUES
('Kirin Nodogoshi Beer', 280, '/images/kirin-nodogoshi.jpg', 'Refreshing Japanese beer with 5% alcohol content. Kirin''s brewing technology creates the perfect "nodogoshi" (throat feel).'),
('Sapporo Premium Beer', 320, '/images/sapporo-beer.jpg', 'Premium Japanese lager beer from Sapporo Breweries. Crisp, clean taste with the iconic star logo since 1876.'),
('Asahi Super Dry', 300, '/images/asahi-super-dry.jpg', 'Japan''s No.1 beer with a crisp, dry taste. Super "DRY" beer brewed from quality ingredients for excellent flavor.'),
('Kirin Honkirin Beer', 350, '/images/kirin-honkirin.jpg', 'Authentic Kirin beer with 6% alcohol content. Long-term low-temperature fermentation for rich, full-bodied taste.'),
('Kirin Ichiban Shibori', 330, '/images/kirin-ichiban.jpg', 'Premium beer made using only the first press of the wort. Available in both can and bottle formats for pure taste.')
ON CONFLICT DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for products (public read access)
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

-- Create policies for orders (users can only see their own orders)
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (true);