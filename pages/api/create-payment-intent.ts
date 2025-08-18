import type { NextApiRequest, NextApiResponse } from 'next';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, amount, currency = 'JPY', productId, quantity } = req.body;

    // Use the provided amount or fallback to default
    const orderAmount = amount || 1400;

    console.log('Creating payment intent with data:', {
      amount: orderAmount,
      currency,
      productId,
      quantity,
      items
    });

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: orderAmount,
      currency: currency.toLowerCase(),
      // Add metadata for tracking
      metadata: {
        productId: productId?.toString() || 'unknown',
        quantity: quantity?.toString() || '1',
        productName: items?.[0]?.name || 'Unknown Product'
      },
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created successfully:', paymentIntent.id);

    // Return exactly the same format as server.js
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Stripe payment intent creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment intent',
      message: error.message 
    });
  }
}