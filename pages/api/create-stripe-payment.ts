import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../lib/stripe';
import { getProductById, createOrder, createPaymentRecord } from '../../lib/products';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, quantity = 1, customerEmail, paymentMethodId } = req.body;

    // Validate input
    if (!productId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get product details
    const product = await getProductById(parseInt(productId));
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const totalAmount = product.price * quantity;

    // Create order in database
    const order = await createOrder({
      product_id: product.id,
      quantity,
      total_amount: totalAmount,
      customer_email: customerEmail,
    });

    if (!order) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    // Create payment record in database
    const paymentRecord = await createPaymentRecord({
      order_id: order.id,
      payment_method: 'stripe',
      amount: totalAmount,
      currency: 'JPY',
      status: 'pending',
      provider_response: {
        product_name: product.name,
        quantity: quantity,
        created_at: new Date().toISOString()
      }
    });

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount, // Amount in smallest currency unit (yen)
      currency: 'jpy',
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?orderId=${order.id}`,
      metadata: {
        orderId: order.id.toString(),
        productId: product.id.toString(),
        quantity: quantity.toString(),
        paymentRecordId: paymentRecord?.id?.toString() || '',
      },
      description: `BeerHub Order #${order.id} - ${product.name} x ${quantity}`,
      receipt_email: customerEmail || undefined,
    });

    // Update payment record with Stripe payment intent ID
    if (paymentRecord && paymentIntent.id) {
      await createPaymentRecord({
        order_id: order.id,
        payment_method: 'stripe',
        payment_provider_id: paymentIntent.id,
        amount: totalAmount,
        currency: 'JPY',
        status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
        provider_response: {
          payment_intent: paymentIntent,
          created_at: new Date().toISOString()
        }
      });
    }

    res.status(200).json({
      success: true,
      orderId: order.id,
      paymentRecordId: paymentRecord?.id,
      paymentIntent: {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
      },
    });

  } catch (error: any) {
    console.error('Stripe payment creation error:', error);

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      res.status(400).json({
        error: 'Card error',
        message: error.message,
        decline_code: error.decline_code
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      res.status(400).json({
        error: 'Invalid request',
        message: error.message
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
}