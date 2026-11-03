import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrderWithPayments } from '../../lib/products';

/** "taro.yamada@gmail.com" -> "ta***@gmail.com" */
function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!domain) return '***';
  return `${name.slice(0, 2)}***@${domain}`;
}

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

    // This endpoint is public (the success page calls it), so personal details are hidden:
    // the email is masked and phone / address are left out.
    const {
      customer_phone: _phone,
      customer_name: _name,
      shipping_address: _address,
      order_notes: _notes,
      ...publicOrder
    } = orderDetails as Record<string, any>;
    if (typeof publicOrder.customer_email === 'string') {
      publicOrder.customer_email = maskEmail(publicOrder.customer_email);
    }
    // Raw payment-provider responses can contain the customer's phone and address.
    if (Array.isArray(publicOrder.payments)) {
      publicOrder.payments = publicOrder.payments.map(
        ({ provider_response: _raw, ...payment }: Record<string, any>) => payment
      );
    }

    res.status(200).json({
      success: true,
      order: publicOrder
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
