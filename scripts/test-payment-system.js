const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPaymentSystem() {
    console.log('🧪 Testing payment system...');

    try {
        // Test 1: Check if orders table exists and has basic columns
        console.log('1️⃣ Testing orders table...');
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .limit(1);

        if (ordersError) {
            console.error('❌ Orders table error:', ordersError.message);
            return false;
        }
        console.log('✅ Orders table accessible');

        // Test 2: Check if payments table exists
        console.log('2️⃣ Testing payments table...');
        const { data: payments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .limit(1);

        if (paymentsError) {
            console.log('⚠️  Payments table not found:', paymentsError.message);
            console.log('📝 You need to run the SQL migration first!');
            console.log('👉 Go to Supabase Dashboard → SQL Editor');
            console.log('👉 Copy and run the contents of supabase/add-payment-details.sql');
            return false;
        }
        console.log('✅ Payments table accessible');

        // Test 3: Try to create a test order
        console.log('3️⃣ Testing order creation...');
        const testOrder = {
            product_id: 1,
            quantity: 1,
            total_amount: 280,
            payment_status: 'pending'
        };

        const { data: newOrder, error: createError } = await supabase
            .from('orders')
            .insert([testOrder])
            .select()
            .single();

        if (createError) {
            console.error('❌ Order creation failed:', createError.message);
            return false;
        }
        console.log('✅ Order created successfully:', newOrder.id);

        // Test 4: Try to create a payment record
        console.log('4️⃣ Testing payment record creation...');
        const testPayment = {
            order_id: newOrder.id,
            payment_method: 'test',
            amount: 280,
            status: 'pending'
        };

        const { data: newPayment, error: paymentError } = await supabase
            .from('payments')
            .insert([testPayment])
            .select()
            .single();

        if (paymentError) {
            console.error('❌ Payment creation failed:', paymentError.message);
            return false;
        }
        console.log('✅ Payment record created successfully:', newPayment.id);

        // Clean up test data
        await supabase.from('payments').delete().eq('id', newPayment.id);
        await supabase.from('orders').delete().eq('id', newOrder.id);
        console.log('🧹 Test data cleaned up');

        console.log('🎉 Payment system is working correctly!');
        return true;

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return false;
    }
}

testPaymentSystem();