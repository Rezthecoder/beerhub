const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        // Test basic connection
        const { data, error } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });

        if (error) {
            console.log('❌ Connection test failed:', error.message);
            console.log('📝 You need to create the tables first. Run the SQL from supabase/schema.sql in your Supabase dashboard.');
            return false;
        }

        console.log('✅ Connection successful!');
        console.log(`📊 Products table exists with ${data} records`);
        return true;
    } catch (err) {
        console.error('❌ Connection error:', err.message);
        return false;
    }
}

async function seedProducts() {
    const sampleProducts = [
        {
            name: 'Premium Craft Beer Set',
            price: 4800,
            image: '/images/beer-set.jpg',
            description: 'Selection of 6 premium craft beers from local breweries'
        },
        {
            name: 'Artisan Pizza Kit',
            price: 3200,
            image: '/images/pizza-kit.jpg',
            description: 'Complete pizza making kit with premium ingredients and dough'
        },
        {
            name: 'Gourmet Burger Combo',
            price: 2800,
            image: '/images/burger-combo.jpg',
            description: 'Delicious gourmet burger with craft beer pairing'
        }
    ];

    console.log('🌱 Adding sample products...');

    const { data, error } = await supabase
        .from('products')
        .insert(sampleProducts)
        .select();

    if (error) {
        console.error('❌ Error adding products:', error.message);
        return false;
    }

    console.log('✅ Sample products added:', data.length);
    return true;
}

async function main() {
    const connected = await testConnection();

    if (connected) {
        // Check if we already have products
        const { data: existingProducts } = await supabase
            .from('products')
            .select('id');

        if (!existingProducts || existingProducts.length === 0) {
            await seedProducts();
        } else {
            console.log('📦 Products already exist, skipping seed');
        }

        console.log('🎉 Setup complete! You can now run: npm run dev');
    }
}

main();