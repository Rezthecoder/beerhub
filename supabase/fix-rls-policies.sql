-- Fix RLS policies to allow product insertion

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Create new policies for products (allow public read and insert)
CREATE POLICY "Products are viewable by everyone" ON products
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert products" ON products
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update products" ON products
    FOR UPDATE USING (true);

-- Create policies for orders (allow public operations for demo)
CREATE POLICY "Anyone can insert orders" ON orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view orders" ON orders
    FOR SELECT USING (true);

CREATE POLICY "Anyone can update orders" ON orders
    FOR UPDATE USING (true);