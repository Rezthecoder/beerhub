import { NextRequest, NextResponse } from 'next/server';
import { getOrderWithPayments, updateOrderPaymentStatus, updatePaymentRecord } from '../../../lib/products';
import { payPayService } from '../../../lib/paypay';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ 
      error: 'Missing orderId parameter' 
    }, { status: 400 });
  }

  try {
    console.log('🔍 Checking payment status for Order:', orderId);

    // Get order details from database
    const orderDetails = await getOrderWithPayments(parseInt(orderId));

    if (!orderDetails) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json({ 
        status: 'not_found',
        message: 'Order not found' 
      }, { status: 404 });
    }

    console.log('📋 Order details:', {
      id: orderDetails.id,
      status: orderDetails.payment_status,
      paymentMethod: orderDetails.payment_method
    });

    // Check if payment is already completed
    if (orderDetails.payment_status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        orderId: orderDetails.id,
        message: 'Payment already completed',
        source: 'database'
      });
    }

    // Re-enabled PayPay API calls for real-time status checking
    try {
      console.log('🔄 Checking PayPay API for real-time status...');
      const paymentRecord = orderDetails.payments?.[0];
      const merchantPaymentId = paymentRecord?.payment_provider_id;
      const consecutiveErrors = (paymentRecord?.provider_response?.consecutive_api_errors || 0);

      if (consecutiveErrors >= 3) {
        console.log(`⚠️ Skipping PayPay API call - too many consecutive errors (${consecutiveErrors})`);
        console.log('📝 Relying on webhook updates and database status');
        return NextResponse.json({
          status: 'pending',
          orderId: orderDetails.id,
          message: 'Payment pending - monitoring via webhooks',
          source: 'database_only',
          consecutiveErrors: consecutiveErrors
        });
      }

      if (merchantPaymentId && orderDetails.payment_method === 'paypay') {
        console.log('📡 Calling PayPay API for payment status...');
        
        const payPayStatus = await payPayService.getPaymentDetails(merchantPaymentId);
        
        if (payPayStatus.success && payPayStatus.data) {
          const payPayData = payPayStatus.data;
          console.log('📊 PayPay API Response:', payPayData);

          // Map PayPay status to our order status
          let newOrderStatus = 'pending';
          let newPaymentStatus = 'pending';

          switch (payPayData.status) {
            case 'COMPLETED':
              newOrderStatus = 'completed';
              newPaymentStatus = 'completed';
              break;
            case 'FAILED':
            case 'CANCELED':
              newOrderStatus = 'failed';
              newPaymentStatus = 'failed';
              break;
            case 'AUTHORIZED':
              newOrderStatus = 'authorized';
              newPaymentStatus = 'authorized';
              break;
            case 'CREATED':
            case 'PENDING':
            default:
              newOrderStatus = 'pending';
              newPaymentStatus = 'pending';
              break;
          }

          // Update order status if changed
          if (newOrderStatus !== orderDetails.payment_status) {
            console.log(`🔄 Updating order status: ${orderDetails.payment_status} -> ${newOrderStatus}`);
            
            await updateOrderPaymentStatus(
              orderDetails.id,
              newOrderStatus,
              merchantPaymentId,
              'paypay',
              orderDetails.total_amount
            );

            // Update payment record
            if (paymentRecord) {
              await updatePaymentRecord(paymentRecord.id, {
                status: newPaymentStatus,
                provider_response: {
                  ...paymentRecord.provider_response,
                  last_api_check: new Date().toISOString(),
                  consecutive_api_errors: 0,
                  paypay_status: payPayData.status
                }
              });
            }

            return NextResponse.json({
              status: newOrderStatus,
              orderId: orderDetails.id,
              message: `Payment status updated to ${newOrderStatus}`,
              source: 'paypay_api',
              paypayStatus: payPayData.status
            });
          } else {
            // Reset consecutive errors on successful API call
            if (paymentRecord && consecutiveErrors > 0) {
              await updatePaymentRecord(paymentRecord.id, {
                provider_response: {
                  ...paymentRecord.provider_response,
                  consecutive_api_errors: 0,
                  last_api_check: new Date().toISOString()
                }
              });
            }

            return NextResponse.json({
              status: newOrderStatus,
              orderId: orderDetails.id,
              message: `Payment status: ${newOrderStatus}`,
              source: 'paypay_api',
              paypayStatus: payPayData.status
            });
          }
        } else {
          throw new Error(payPayStatus.error || 'PayPay API call failed');
        }
      } else {
        console.log('📝 No PayPay merchantPaymentId found, returning database status');
        return NextResponse.json({
          status: orderDetails.payment_status,
          orderId: orderDetails.id,
          message: `Payment status: ${orderDetails.payment_status}`,
          source: 'database_only'
        });
      }
    } catch (apiError: any) {
      console.log('⚠️ PayPay API check failed:', apiError.message);
      console.log('📝 Continuing with database status - this is normal for test mode or network issues');
      
      // Update consecutive errors count
      if (orderDetails.payments?.[0]) {
        const paymentRecord = orderDetails.payments[0];
        const currentErrors = (paymentRecord.provider_response?.consecutive_api_errors || 0);
        
        await updatePaymentRecord(paymentRecord.id, {
          provider_response: {
            ...paymentRecord.provider_response,
            consecutive_api_errors: currentErrors + 1,
            last_api_error: apiError.message,
            last_api_error_time: new Date().toISOString()
          }
        });
      }

      return NextResponse.json({
        status: orderDetails.payment_status,
        orderId: orderDetails.id,
        message: `Payment status: ${orderDetails.payment_status} (API check failed)`,
        source: 'database_fallback',
        error: apiError.message
      });
    }

  } catch (error: any) {
    console.error('❌ Payment status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check payment status',
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Handle manual payment actions (for testing)
  const body = await request.json();
  const { orderId, action } = body;

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  if (!action) {
    return NextResponse.json({ error: 'Missing action' }, { status: 400 });
  }

  try {
    console.log(`🔧 Manual payment action: ${action} for order: ${orderId}`);

    // Get order details from database
    const orderDetails = await getOrderWithPayments(parseInt(orderId as string));

    if (!orderDetails) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json({ 
        status: 'not_found',
        message: 'Order not found' 
      }, { status: 404 });
    }

    if (action === 'force_complete') {
      console.log('✅ Force completing payment for order:', orderId);
      
      // Update order status to completed
      await updateOrderPaymentStatus(
        parseInt(orderId as string),
        'completed',
        'manual_force_complete',
        orderDetails.payment_method || 'paypay',
        orderDetails.total_amount
      );

      // Update payment record if exists
      if (orderDetails.payments && orderDetails.payments.length > 0) {
        const paymentRecord = orderDetails.payments[0];
        await updatePaymentRecord(paymentRecord.id, {
          status: 'completed',
          provider_response: {
            ...paymentRecord.provider_response,
            manual_force_complete: true,
            force_completed_at: new Date().toISOString(),
            source: 'manual_force_complete'
          }
        });
      }

      console.log('✅ Payment force completed successfully');
      
      return NextResponse.json({
        status: 'completed',
        orderId: orderDetails.id,
        message: 'Payment manually completed for testing',
        method: orderDetails.payment_method,
        source: 'manual_force_complete'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('Manual payment action error:', error);
    return NextResponse.json({ 
      error: 'Failed to process manual payment action',
      details: error.message 
    }, { status: 500 });
  }
}
