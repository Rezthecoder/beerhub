import type { NextApiRequest, NextApiResponse } from 'next';
import { payPayService } from '../../lib/paypay';
import { updateOrderPaymentStatus } from '../../lib/products';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { merchantPaymentId, orderId } = req.query;

    if (!merchantPaymentId || !orderId) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing payment parameters',
        redirectUrl: `/payment/failed?error=missing_parameters`
      });
    }

    // Get payment status from PayPay
    const paymentDetails = await payPayService.getPaymentDetails(merchantPaymentId as string);

    if (paymentDetails.resultInfo.code !== 'SUCCESS') {
      return res.status(400).json({ 
        success: false,
        error: 'Failed to get payment details',
        details: paymentDetails.resultInfo.message,
        redirectUrl: `/payment/failed?error=paypay_api_error&details=${encodeURIComponent(paymentDetails.resultInfo.message)}`
      });
    }

    const paymentStatus = paymentDetails.data?.status;
    let orderStatus = 'pending';

    // Map PayPay status to our order status
    switch (paymentStatus) {
      case 'COMPLETED':
        orderStatus = 'completed';
        break;
      case 'FAILED':
      case 'CANCELED':
        orderStatus = 'failed';
        break;
      default:
        orderStatus = 'pending';
    }

    // Update order status in database
    const updatedOrder = await updateOrderPaymentStatus(
      parseInt(orderId as string),
      orderStatus,
      paymentDetails.data?.paymentId
    );

    if (!updatedOrder) {
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update order status',
        redirectUrl: `/payment/failed?error=database_error`
      });
    }

    // Return redirect URL instead of redirecting directly
    if (orderStatus === 'completed') {
      res.status(200).json({
        success: true,
        orderStatus,
        redirectUrl: `/payment/success?orderId=${orderId}&paymentId=${paymentDetails.data?.paymentId}&method=paypay`
      });
    } else {
      res.status(200).json({
        success: false,
        orderStatus,
        redirectUrl: `/payment/failed?orderId=${orderId}&reason=${paymentStatus}&method=paypay`
      });
    }

  } catch (error: any) {
    console.error('Payment callback error:', error);
    res.status(500).json({
      success: false,
      error: 'callback_error',
      message: error.message,
      redirectUrl: `/payment/failed?error=callback_error`
    });
  }
}