import { NextRequest, NextResponse } from 'next/server';
import { updateOrderPaymentStatus, updatePaymentRecord, getOrderWithPayments } from '../../../lib/products';

export async function POST(request: NextRequest) {
  try {
    const webhookData = await request.json();

    console.log('🎯 PayPay Webhook Received:', {
      body: webhookData
    });
    
    console.log('🔍 Raw webhook data:', JSON.stringify(webhookData, null, 2));

    // Extract payment information from PayPay webhook payload
    const {
      notification_type,
      merchant_id,
      store_id,
      pos_id,
      order_id,
      merchant_order_id,  // This is your order ID!
      authorized_at,
      expires_at,
      paid_at,
      order_amount,
      state,              // This is the payment status!
      reauth_request_id
    } = webhookData;

    // Use merchant_order_id as the order identifier
    let merchantPaymentId = merchant_order_id;
    
    // Use state as the payment status
    const finalPaypayStatus = state;

    if (!merchantPaymentId) {
      console.error('❌ Missing merchant_order_id in webhook data');
      console.log('🔍 Full webhook data received:', JSON.stringify(webhookData, null, 2));
      
      // Try to extract from different possible fields for backward compatibility
      const possiblePaymentId = webhookData.merchantPaymentId || webhookData.paymentId || webhookData.payment_id || webhookData.merchant_payment_id || webhookData.id;
      
      if (possiblePaymentId) {
        console.log('✅ Found payment ID in alternative field:', possiblePaymentId);
        merchantPaymentId = possiblePaymentId;
      } else {
        console.log('❌ No payment ID found in webhook data');
        return NextResponse.json({ 
          error: 'Missing merchant_order_id',
          receivedData: webhookData,
          message: 'Please check PayPay webhook configuration and data format'
        }, { status: 400 });
      }
    }

    console.log('📋 PayPay Webhook Data:', {
      notification_type,
      merchant_order_id: merchantPaymentId,
      order_id,
      state: finalPaypayStatus,
      order_amount,
      paid_at,
      authorized_at
    });

    // Find the order by merchantPaymentId in the payments table
    let orderId = null;
    let orderDetails = null;
    
    // Direct lookup: merchantPaymentId IS the order ID
    console.log('🔍 Using merchantPaymentId directly as order ID...');
    
    try {
      const orderIdFromMerchantId = parseInt(merchantPaymentId);
      console.log(`🔍 Order ID from merchantPaymentId: ${orderIdFromMerchantId}`);
      
      if (isNaN(orderIdFromMerchantId)) {
        console.log('❌ merchantPaymentId is not a valid order ID');
        return NextResponse.json({ 
          error: 'Invalid merchantPaymentId format',
          merchantPaymentId
        }, { status: 400 });
      }
      
      const order = await getOrderWithPayments(orderIdFromMerchantId);
      
      if (order) {
        orderDetails = order;
        orderId = order.id;
        console.log(`✅ Found order ${orderId} directly!`);
      } else {
        console.log(`❌ Order ${orderIdFromMerchantId} not found`);
      }
    } catch (error: any) {
      console.log(`⚠️ Error looking up order:`, error.message);
    }

    if (!orderDetails) {
      console.error('❌ Order not found for merchantPaymentId:', merchantPaymentId);
      console.log('🔍 Tried all lookup methods but no order found');
      return NextResponse.json({ 
        error: 'Order not found',
        merchantPaymentId,
        lookupAttempts: 'direct_order_id_lookup'
      }, { status: 404 });
    }

    console.log('✅ Order found:', orderDetails.id);

    // Map PayPay status to our order status
    let orderStatus = 'pending';
    let paymentStatus = 'pending';

    switch (finalPaypayStatus) {
      case 'COMPLETED':
        orderStatus = 'completed';
        paymentStatus = 'completed';
        break;
      case 'FAILED':
      case 'CANCELED':
        orderStatus = 'failed';
        paymentStatus = 'failed';
        break;
      case 'PENDING':
      default:
        orderStatus = 'pending';
        paymentStatus = 'pending';
        break;
    }

    // Update order status
    const updatedOrder = await updateOrderPaymentStatus(
      orderDetails.id,
      orderStatus,
      order_id || merchantPaymentId,
      'paypay',
      order_amount || orderDetails.total_amount
    );

    if (!updatedOrder) {
      console.error('❌ Failed to update order status');
      return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
    }

    // Update payment record if we have one
    if (orderDetails.payments && orderDetails.payments.length > 0) {
      const paymentRecord = orderDetails.payments[0];
      await updatePaymentRecord(paymentRecord.id, {
        status: paymentStatus,
        payment_provider_id: order_id || merchantPaymentId,
        provider_response: {
          ...paymentRecord.provider_response,
          webhook_data: webhookData,
          updated_at: new Date().toISOString()
        }
      });
    }

    console.log(`✅ Webhook processed successfully: Order ${orderDetails.id} -> ${orderStatus}`);
    console.log(`📊 Database updated:`, {
      orderId: orderDetails.id,
      oldStatus: orderDetails.payment_status,
      newStatus: orderStatus,
      paymentId: order_id || merchantPaymentId,
      amount: order_amount || orderDetails.total_amount
    });

    // Return success to PayPay
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: orderDetails.id,
      status: orderStatus
    });

  } catch (error: any) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({
      error: 'Webhook processing failed',
      message: error.message
    }, { status: 500 });
  }
}
