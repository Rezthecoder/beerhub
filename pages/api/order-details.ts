import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrderWithPayments } from '../../lib/products';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderId } = req.query;

  if (!orderId) {
    return res.status(400).json({ error: 'Missing orderId parameter' });
  }

  try {
    console.log('🔍 Fetching order details for Order ID:', orderId);

    // Parse orderId to number
    const orderIdNum = parseInt(orderId as string);
    if (isNaN(orderIdNum)) {
      return res.status(400).json({ error: 'Invalid orderId format' });
    }

    // Fetch order details from database
    const orderDetails = await getOrderWithPayments(orderIdNum);

    if (!orderDetails) {
      console.log('❌ Order not found:', orderId);
      return res.status(404).json({ 
        error: 'Order not found',
        orderId: orderId 
      });
    }

    console.log('✅ Order details fetched successfully:', {
      orderId: orderDetails.id,
      productName: orderDetails.products?.name,
      paymentStatus: orderDetails.payment_status,
      paymentMethod: orderDetails.payment_method
    });

    // Return order details
    res.status(200).json({
      success: true,
      order: orderDetails
    });

  } catch (error: any) {
    console.error('❌ Error fetching order details:', error);
    res.status(500).json({
      error: 'Failed to fetch order details',
      message: error.message,
      orderId: orderId
    });
  }
}
