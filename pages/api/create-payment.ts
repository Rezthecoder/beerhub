import type { NextApiRequest, NextApiResponse } from 'next';
import { getProductById, createOrder, createPaymentRecord, updatePaymentRecord } from '../../lib/products';
import { payPayService } from '../../lib/paypay';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, quantity = 1, customerEmail } = req.body;

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

    const merchantPaymentId = order.id.toString();

    // Create PayPay payment
    const paymentRequest = {
      merchantPaymentId,
      amount: {
        amount: totalAmount,
        currency: 'JPY' as const,
      },
      orderDescription: `${product.name} x ${quantity}`,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/callback`,
      redirectType: 'APP_DEEP_LINK',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1'
    };

    // Create payment record in database first
    const paymentRecord = await createPaymentRecord({
      order_id: order.id,
      payment_method: 'paypay',
      amount: totalAmount,
      currency: 'JPY',
      status: 'pending',
      provider_response: {
        merchant_payment_id: merchantPaymentId,
        product_name: product.name,
        quantity: quantity,
        created_at: new Date().toISOString()
      }
    });

    try {
      // Add webhook URL to the payment request
      const paymentRequestWithWebhook = {
        ...paymentRequest,
        webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/paypay-webhook`
      };
      
      const paymentResponse = await payPayService.createPayment(paymentRequestWithWebhook);

      if (paymentResponse.resultInfo.code !== 'SUCCESS') {
        // Update payment record as failed
        if (paymentRecord) {
          await updatePaymentRecord(paymentRecord.id, {
            status: 'failed',
            provider_response: paymentResponse
          });
        }

        return res.status(400).json({
          error: 'PayPay payment creation failed',
          details: paymentResponse.resultInfo.message,
          code: paymentResponse.resultInfo.code
        });
      }

      // Update payment record with PayPay response
      if (paymentRecord && paymentResponse.data) {
        await updatePaymentRecord(paymentRecord.id, {
          payment_provider_id: merchantPaymentId, // Store the merchantPaymentId
          provider_response: {
            ...paymentResponse,
            merchantPaymentId: merchantPaymentId // Also store in provider_response
          }
        });
      }

      console.log(`✅ PayPay payment created for order ${order.id}, amount: ¥${totalAmount}`);
      console.log(`PayPay Payment ID: ${paymentResponse.data?.paymentId}`);
      console.log(`PayPay Web URL: ${paymentResponse.data?.webPaymentUrl}`);
      console.log('Full PayPay Response:', JSON.stringify(paymentResponse, null, 2));

      // Check if we have a payment URL
      const webPaymentUrl = paymentResponse.data?.webPaymentUrl || paymentResponse.data?.deeplink;

      if (!webPaymentUrl) {
        console.error('❌ No payment URL in PayPay response');
        console.error('PayPay data:', paymentResponse.data);

        // For demo purposes, create a mock payment URL
        const mockPaymentUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-paypay-payment?orderId=${order.id}&merchantPaymentId=${merchantPaymentId}&paymentId=${paymentRecord?.id}&demo=true`;

        return res.status(200).json({
          success: true,
          orderId: order.id,
          paymentRecordId: paymentRecord?.id,
          paymentId: paymentResponse.data?.paymentId || `paypay_${Date.now()}`,
          webPaymentUrl: mockPaymentUrl,
          merchantPaymentId,
          demo: true,
          message: 'Using demo PayPay payment flow'
        });
      }

      res.status(200).json({
        success: true,
        orderId: order.id,
        paymentRecordId: paymentRecord?.id,
        paymentId: paymentResponse.data?.paymentId,
        webPaymentUrl: webPaymentUrl,
        deeplink: paymentResponse.data?.deeplink,
        merchantPaymentId,
        qrCodeUrl: paymentResponse.data?.webPaymentUrl, // For QR code display
      });

    } catch (paypayError: any) {
      console.error('PayPay API Error:', paypayError);

      // Update payment record as failed
      if (paymentRecord) {
        await updatePaymentRecord(paymentRecord.id, {
          status: 'failed',
          provider_response: { error: paypayError.message }
        });
      }

      // Check if it's a configuration error
      if (paypayError.message.includes('clientId') || paypayError.message.includes('merchantId')) {
        return res.status(500).json({
          error: 'PayPay configuration error',
          message: 'Please check your PayPay API credentials in environment variables',
          details: paypayError.message
        });
      }

      // For other errors, return the actual error
      return res.status(400).json({
        error: 'PayPay payment failed',
        message: paypayError.message,
        orderId: order.id
      });
    }

  } catch (error: any) {
    console.error('Payment creation error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}