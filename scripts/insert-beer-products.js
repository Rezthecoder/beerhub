const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const beerProducts = [
    {
        name: 'Kirin Nodogoshi Beer',
        price: 280,
        image: '/images/nodogosi.jpg',
        description: 'Refreshing Japanese beer with 5% alcohol content. Kirin\'s brewing technology creates the perfect "nodogoshi" (throat feel).'
    },
    {
        name: 'Sapporo Premium Beer',
        price: 320,
        image: '/images/sapporo.webp',
        description: 'Premium Japanese lager beer from Sapporo Breweries. Crisp, clean taste with the iconic star logo since 1876.'
    },
    {
        name: 'Kirin Ichiban Shibori',
        price: 330,
        image: '/images/kirin.webp',
        description: 'Premium beer made using only the first press of the wort. Pure taste from Japan\'s finest brewing techniques.'
    },
    {
        name: 'Kirin Honkirin Beer',
        price: 350,
        image: '/images/honkirin.webp',
        description: 'Authentic Kirin beer with 6% alcohol content. Long-term low-temperature fermentation for rich, full-bodied taste.'
    },
    {
        name: 'Kirin Nama Beer',
        price: 310,
        image: '/images/nama.webp',
        description: 'Fresh draft beer taste in a can. Unpasteurized for maximum flavor and authentic brewery experience.'
    }
];

async function insertBeerProducts() {
    console.log('🍺 Inserting Japanese beer products...');

    try {
        // First, let's check if we can connect
        const { data: testData, error: testError } = await supabase
            .from('products')
            .select('count', { count: 'exact', head: true });

        if (testError) {
            console.error('❌ Connection failed:', testError.message);
            console.log('📝 Make sure you have created the tables first using supabase/schema.sql');
            return;
        }

        console.log('✅ Connected to database');

        // Clear existing products (optional)
        const { error: deleteError } = await supabase
            .from('products')
            .delete()
            .neq('id', 0); // Delete all products

        if (deleteError) {
            console.log('⚠️  Could not clear existing products:', deleteError.message);
        } else {
            console.log('🗑️  Cleared existing products');
        }

        // Insert beer products
        const { data, error } = await supabase
            .from('products')
            .insert(beerProducts)
            .select();

        if (error) {
            console.error('❌ Error inserting beer products:', error);
            return;
        }

        console.log('✅ Successfully inserted beer products:');
        data.forEach(product => {
            console.log(`   🍺 ${product.name} - ¥${product.price}`);
        });

        console.log('🎉 Beer products added to database successfully!');
        console.log('🚀 You can now run: npm run dev');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

insertBeerProducts();