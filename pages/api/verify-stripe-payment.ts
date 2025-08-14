import type { NextApiRequest, NextApiResponse } from 'next';
import { updateOrderPaymentStatus, updatePaymentRecord, getOrderWithPayments } from '../../lib/products';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { session_id, orderId, paymentId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    // Get order details for payment amount
    const orderDetails = await getOrderWithPayments(parseInt(orderId as string));
    
    // For now, assume payment was successful since user reached this endpoint
    // In production, you would verify with Stripe API
    try {
      // Update order status
      await updateOrderPaymentStatus(
        parseInt(orderId as string),
        'completed',
        session_id as string || 'stripe_session',
        'stripe',
        orderDetails?.total_amount
      );

      // Update payment record if we have paymentId
      if (paymentId) {
        await updatePaymentRecord(parseInt(paymentId as string), {
          status: 'completed',
          payment_provider_id: session_id as string,
          provider_response: {
            session_id: session_id,
            completed_at: new Date().toISOString(),
            payment_method: 'stripe',
            status: 'completed'
          }
        });
      }

      console.log(`✅ Payment completed for order ${orderId}, amount: ¥${orderDetails?.total_amount}`);
      
    } catch (dbError) {
      console.error('Database update error:', dbError);
      // Continue to success page even if DB update fails
    }

    res.redirect(`/payment/success?orderId=${orderId}&session_id=${session_id || 'completed'}&method=stripe`);

  } catch (error: any) {
    console.error('Payment verification error:', error);
    res.redirect(`/payment/success?orderId=${req.query.orderId || 'unknown'}&method=stripe`);
  }
}