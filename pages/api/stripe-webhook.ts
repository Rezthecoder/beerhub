import type { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../lib/stripe';
import { updateOrderPaymentStatus } from '../../lib/products';
import { buffer } from 'micro';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured');
    }
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Webhook signature verification failed' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as any;
        const orderId = parseInt(session.metadata.orderId);
        
        // Update order status to completed
        await updateOrderPaymentStatus(orderId, 'completed', session.id);
        console.log(`Order ${orderId} marked as completed`);
        break;

      case 'checkout.session.expired':
        const expiredSession = event.data.object as any;
        const expiredOrderId = parseInt(expiredSession.metadata.orderId);
        
        // Update order status to failed
        await updateOrderPaymentStatus(expiredOrderId, 'failed', expiredSession.id);
        console.log(`Order ${expiredOrderId} marked as failed (expired)`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}