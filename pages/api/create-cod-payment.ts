import type { NextApiRequest, NextApiResponse } from 'next';
import { getProductById, createOrder, createPaymentRecord } from '../../lib/products';
import { supabase } from '../../lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, quantity = 1, customerEmail, customerName, customerPhone, shippingAddress } = req.body;
    
    // Validate input
    if (!productId || !quantity || !customerName || !customerPhone || !shippingAddress) {
      return res.status(400).json({ error: 'Missing required fields for COD payment' });
    }

    // Get product details
    const product = await getProductById(parseInt(productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalAmount = product.price * quantity;

    // Create order in database with COD details
    const order = await createOrder({
      product_id: product.id,
      quantity,
      total_amount: totalAmount,
      customer_email: customerEmail,
    });

    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Update order with COD-specific information
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_method: 'cod',
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        payment_status: 'pending_cod',
        order_notes: 'Cash on Delivery - Payment will be collected upon delivery'
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order with COD details:', updateError);
    }

    // Create payment record for COD
    const paymentRecord = await createPaymentRecord({
      order_id: order.id,
      payment_method: 'cod',
      amount: totalAmount,
      currency: 'JPY',
      status: 'pending_cod',
      provider_response: {
        customer_name: customerName,
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        product_name: product.name,
        quantity: quantity,
        created_at: new Date().toISOString(),
        payment_type: 'cash_on_delivery'
      }
    });

    console.log(`✅ COD order created for ${customerName}, amount: ¥${totalAmount}`);

    res.status(200).json({
      success: true,
      orderId: order.id,
      paymentRecordId: paymentRecord?.id,
      paymentMethod: 'cod',
      totalAmount,
      customerName,
      estimatedDelivery: '3-5 business days'
    });

  } catch (error: any) {
    console.error('COD payment creation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}