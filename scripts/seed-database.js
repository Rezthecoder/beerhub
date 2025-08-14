const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function seedDatabase() {
    console.log('🌱 Seeding database...');

    try {
        // Insert products
        const { data, error } = await supabase
            .from('products')
            .insert(sampleProducts)
            .select();

        if (error) {
            console.error('❌ Error inserting products:', error);
            return;
        }

        console.log('✅ Successfully inserted products:', data);
        console.log('🎉 Database seeded successfully!');
    } catch (error) {
        console.error('❌ Error seeding database:', error);
    }
}

seedDatabase();