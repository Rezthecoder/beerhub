import { NextRequest, NextResponse } from 'next/server';
import { createOrder, createPaymentRecord } from '../../../lib/products';
import { payPayService } from '../../../lib/paypay';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, quantity, customerEmail, paymentMethod } = body;

    console.log('🚀 Creating payment request:', { productId, quantity, customerEmail, paymentMethod });

    // Validate required fields
    if (!productId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: productId and quantity' },
        { status: 400 }
      );
    }

    // Create order in database
    const order = await createOrder({
      product_id: productId,
      quantity,
      total_amount: quantity * 300, // Assuming fixed price for now
      customer_email: customerEmail || '',
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    const merchantPaymentId = order.id.toString();

    if (paymentMethod === 'cod') {
      // For Cash on Delivery, just create the order
      console.log('✅ COD order created successfully:', order.id);
      
      return NextResponse.json({
        success: true,
        orderId: order.id,
        message: 'Cash on Delivery order created successfully'
      });
    }

    // For PayPay, create payment request
    if (paymentMethod === 'paypay' || !paymentMethod) {
      try {
        const paymentRequest = {
          merchantPaymentId,
          amount: {
            amount: order.total_amount,
            currency: 'JPY' as const,
          },
          orderDescription: `Order ${order.id}`,
          redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/callback`,
          redirectType: 'APP_DEEP_LINK' as const,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 10_3 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.75 Mobile/14E5239e Safari/602.1',
          webhookUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/paypay-webhook`
        };

        const payPayResult = await payPayService.createPayment(paymentRequest);

        if (payPayResult.success && payPayResult.data) {
          // Create payment record
          await createPaymentRecord({
            order_id: order.id,
            payment_method: 'paypay',
            payment_provider_id: merchantPaymentId,
            amount: order.total_amount,
            currency: 'JPY',
            status: 'pending',
            provider_response: {
              paypay_payment_id: payPayResult.data.paymentId,
              qr_code_url: payPayResult.data.qrCodeUrl,
              web_payment_url: payPayResult.data.webPaymentUrl,
              created_at: new Date().toISOString()
            }
          });

          console.log('✅ PayPay payment created successfully:', {
            orderId: order.id,
            paymentId: payPayResult.data.paymentId,
            qrCodeUrl: payPayResult.data.qrCodeUrl
          });

          return NextResponse.json({
            success: true,
            orderId: order.id,
            paymentId: payPayResult.data.paymentId,
            merchantPaymentId: merchantPaymentId,
            qrCodeUrl: payPayResult.data.qrCodeUrl,
            webPaymentUrl: payPayResult.data.webPaymentUrl,
            message: 'PayPay payment created successfully'
          });
        } else {
          throw new Error(payPayResult.error || 'PayPay payment creation failed');
        }
      } catch (payPayError: any) {
        console.error('❌ PayPay payment creation error:', payPayError);
        
        // Update order status to failed
        // await updateOrderPaymentStatus(order.id, 'failed', merchantPaymentId, 'paypay', order.total_amount);
        
        return NextResponse.json(
          { error: `PayPay Error: ${payPayError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Unsupported payment method' },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('❌ Payment creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment', details: error.message },
      { status: 500 }
    );
  }
}
