# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `food-and-beer-shop`
   - Database Password: (generate a strong password)
   - Region: Choose closest to your users (e.g., Northeast Asia for Japan)
6. Click "Create new project"

## 2. Get Your Project Credentials

After your project is created:

1. Go to Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **service_role key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Update Your .env File

Replace the placeholder values in your `.env` file:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 4. Create Database Tables

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase/schema.sql`
5. Click "Run" to execute the SQL

This will create:
- `products` table with sample data
- `orders` table for storing orders
- Proper indexes and relationships
- Row Level Security policies

## 5. Verify Setup

1. Go to "Table Editor" in your Supabase dashboard
2. You should see:
   - `products` table with 3 sample products
   - `orders` table (empty initially)

## 6. Test Your Connection

Run your Next.js app:

```bash
npm run dev
```

Visit `http://localhost:3000` - you should see the products loaded from Supabase!

## 7. Optional: Upload Product Images

1. Go to "Storage" in your Supabase dashboard
2. Create a new bucket called `product-images`
3. Make it public
4. Upload your product images
5. Update the image URLs in your products table

## Database Schema

### Products Table
- `id`: Primary key
- `name`: Product name
- `price`: Price in yen (integer)
- `image`: Image URL
- `description`: Product description
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Orders Table
- `id`: Primary key
- `product_id`: Foreign key to products
- `quantity`: Number of items
- `total_amount`: Total price in yen
- `payment_status`: 'pending', 'completed', 'failed'
- `payment_id`: PayPay payment ID
- `customer_email`: Customer email (optional)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Security Notes

- Row Level Security (RLS) is enabled
- Products are publicly readable
- Orders can be created by anyone (for demo purposes)
- In production, you should add proper authentication and user-specific policies