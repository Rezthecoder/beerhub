// pages/api/check-payment-status.ts
// 
// Smart Payment Status Checking with PayPay Integration
// 
// Features:
// 1. Database-first status checking (from webhooks)
// 2. PayPay API fallback for real-time updates
// 3. Smart error handling for DYNAMIC_QR_PAYMENT_NOT_FOUND
// 4. Automatic fallback to webhook-only monitoring after 3 consecutive API errors
// 5. Manual testing endpoints for development
// 
// Manual Testing Endpoints (POST):
// - /api/check-payment-status (action: 'manual_update') - Update order status
// - /api/check-payment-status (action: 'reset_api_errors') - Reset API error count
// - /api/check-payment-status (action: 'force_complete') - Force complete order
// 
// Example usage:
// curl -X POST http://localhost:3000/api/check-payment-status \
//   -H "Content-Type: application/json" \
//   -d '{"orderId": "102", "action": "force_complete"}'
import type { NextApiRequest, NextApiResponse } from 'next';
import { getOrderWithPayments, updateOrderPaymentStatus, updatePaymentRecord } from '../../lib/products';
import { payPayService } from '../../lib/paypay';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { orderId } = req.query;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    try {
      console.log('🔍 Checking payment status for order:', orderId);

      // Get order details from database
        const orderDetails = await getOrderWithPayments(parseInt(orderId as string));

        if (!orderDetails) {
        console.log('❌ Order not found:', orderId);
        return res.status(404).json({ 
          status: 'not_found',
          message: 'Order not found' 
        });
      }

      console.log('📋 Order found:', {
        id: orderDetails.id,
        payment_status: orderDetails.payment_status,
        payment_method: orderDetails.payment_method,
        payments: orderDetails.payments
      });

      // Check order payment status
      if (orderDetails.payment_status === 'completed') {
            return res.status(200).json({
                status: 'completed',
          orderId: orderDetails.id,
          message: 'Payment completed successfully',
          completedAt: orderDetails.payment_completed_at
        });
      }

      if (orderDetails.payment_status === 'failed') {
                            return res.status(200).json({
                                status: 'failed',
          orderId: orderDetails.id,
                                message: 'Payment failed or was canceled'
                            });
      }

      // Check if we have payment records
      if (orderDetails.payments && orderDetails.payments.length > 0) {
        const paymentRecord = orderDetails.payments[0];
        console.log('💳 Payment record found:', {
          id: paymentRecord.id,
          status: paymentRecord.status,
          method: paymentRecord.payment_method
        });

        if (paymentRecord.status === 'completed') {
                            return res.status(200).json({
            status: 'completed',
            orderId: orderDetails.id,
            paymentId: paymentRecord.id,
            message: 'Payment completed successfully',
            method: paymentRecord.payment_method
          });
        }

        if (paymentRecord.status === 'failed') {
                    return res.status(200).json({
            status: 'failed',
            orderId: orderDetails.id,
            paymentId: paymentRecord.id,
            message: 'Payment failed or was canceled',
            method: paymentRecord.payment_method
          });
        }
      }

      // Re-enabled PayPay API calls for real-time status checking
      try {
        console.log('🔄 Checking PayPay API for real-time status...');
        
        if (orderDetails.payments && orderDetails.payments.length > 0) {
          const paymentRecord = orderDetails.payments[0];
          const merchantPaymentId = paymentRecord.payment_provider_id;
          
          if (merchantPaymentId) {
            // Check if we've had too many DYNAMIC_QR_PAYMENT_NOT_FOUND errors
            const providerResponse = paymentRecord.provider_response || {};
            const consecutiveErrors = providerResponse.consecutive_api_errors || 0;
            
            if (consecutiveErrors >= 3) {
              console.log(`⚠️ Skipping PayPay API call - too many consecutive errors (${consecutiveErrors})`);
              console.log('📝 Relying on webhook updates and database status');
                    return res.status(200).json({
                        status: 'pending',
                orderId: orderDetails.id,
                message: 'Payment pending - monitoring via webhooks',
                orderStatus: orderDetails.payment_status,
                paymentMethod: orderDetails.payment_method,
                source: 'database_only',
                consecutiveErrors: consecutiveErrors
              });
            }
            
            console.log('🔍 Checking PayPay API for merchantPaymentId:', merchantPaymentId);
            
            const payPayStatus = await payPayService.getPaymentDetails(merchantPaymentId);
            
            if (payPayStatus.resultInfo.code === 'SUCCESS' && payPayStatus.data) {
              console.log('📋 PayPay API response:', payPayStatus.data);
              console.log('📊 PayPay status:', payPayStatus.data.status);
              console.log('📊 PayPay result code:', payPayStatus.resultInfo.code);
              
              // Reset consecutive errors on success
              await updatePaymentRecord(paymentRecord.id, {
                provider_response: {
                  ...paymentRecord.provider_response,
                  consecutive_api_errors: 0,
                  last_successful_api_check: new Date().toISOString(),
                  paypay_status: payPayStatus.data.status,
                  last_api_check: new Date().toISOString(),
                  source: 'paypay_api'
                }
              });
              
              // Map PayPay statuses to our system
              const payPayStatusMap: { [key: string]: string } = {
                'CREATED': 'pending',
                'COMPLETED': 'completed',
                'AUTHORIZED': 'authorized', // For preauth payments
                'FAILED': 'failed',
                'CANCELED': 'failed',
                'EXPIRED': 'failed'
              };
              
              const mappedStatus = payPayStatusMap[payPayStatus.data.status] || 'pending';
              console.log(`🔄 Status mapping: PayPay "${payPayStatus.data.status}" -> Our "${mappedStatus}"`);
              
              // Update database if payment is completed
              if (payPayStatus.data.status === 'COMPLETED') {
                console.log('✅ PayPay API shows payment completed - updating database...');
                
                // Update the payment record status
                await updatePaymentRecord(paymentRecord.id, {
                  status: 'completed',
                  provider_response: {
                    ...paymentRecord.provider_response,
                    consecutive_api_errors: 0,
                    paypay_status: payPayStatus.data.status,
                    last_api_check: new Date().toISOString(),
                    source: 'paypay_api'
                  }
                });
                
                return res.status(200).json({
                  status: 'completed',
                  orderId: orderDetails.id,
                  paymentId: paymentRecord.id,
                  message: 'Payment completed successfully (confirmed via PayPay API)',
                  method: paymentRecord.payment_method,
                  payPayStatus: payPayStatus.data.status,
                  source: 'paypay_api',
                  mappedStatus: mappedStatus
                });
              } else if (payPayStatus.data.status === 'FAILED' || payPayStatus.data.status === 'CANCELED') {
                console.log('❌ PayPay API shows payment failed/canceled');
                
                await updatePaymentRecord(paymentRecord.id, {
                  status: 'failed',
                  provider_response: {
                    ...paymentRecord.provider_response,
                    consecutive_api_errors: 0,
                    paypay_status: payPayStatus.data.status,
                    last_api_check: new Date().toISOString(),
                    source: 'paypay_api'
                  }
                });
                
                return res.status(200).json({
                  status: 'failed',
                  orderId: orderDetails.id,
                  paymentId: paymentRecord.id,
                  message: `Payment ${payPayStatus.data.status.toLowerCase()} (confirmed via PayPay API)`,
                  method: paymentRecord.payment_method,
                  payPayStatus: payPayStatus.data.status,
                  source: 'paypay_api',
                  mappedStatus: mappedStatus
                });
              } else if (payPayStatus.data.status === 'AUTHORIZED') {
                console.log('🔐 PayPay API shows payment authorized (preauth)');
                
                return res.status(200).json({
                  status: 'authorized',
                  orderId: orderDetails.id,
                  paymentId: paymentRecord.id,
                  message: 'Payment authorized (preauth) - waiting for completion',
                  method: paymentRecord.payment_method,
                  payPayStatus: payPayStatus.data.status,
                  source: 'paypay_api',
                  mappedStatus: mappedStatus
                });
              } else {
                console.log(`⏳ PayPay API shows status: ${payPayStatus.data.status} - continuing to poll...`);
                
                // Update the payment record with current PayPay status
                await updatePaymentRecord(paymentRecord.id, {
                  provider_response: {
                    ...paymentRecord.provider_response,
                    consecutive_api_errors: 0,
                    paypay_status: payPayStatus.data.status,
                    last_api_check: new Date().toISOString(),
                    source: 'paypay_api'
                  }
                    });
                }
            } else {
              console.log('⚠️ PayPay API returned non-success result:', payPayStatus.resultInfo);
              
              // Handle DYNAMIC_QR_PAYMENT_NOT_FOUND specifically
              if (payPayStatus.resultInfo.code === 'DYNAMIC_QR_PAYMENT_NOT_FOUND') {
                const newConsecutiveErrors = consecutiveErrors + 1;
                console.log(`🚨 DYNAMIC_QR_PAYMENT_NOT_FOUND error #${newConsecutiveErrors}`);
                
                await updatePaymentRecord(paymentRecord.id, {
                  provider_response: {
                    ...paymentRecord.provider_response,
                    consecutive_api_errors: newConsecutiveErrors,
                    last_api_error: payPayStatus.resultInfo.code,
                    last_api_error_time: new Date().toISOString(),
                    last_api_check: new Date().toISOString()
                  }
                });
                
                if (newConsecutiveErrors >= 3) {
                  console.log('🔄 Switching to webhook-only monitoring after 3 consecutive errors');
                return res.status(200).json({
                    status: 'pending',
                    orderId: orderDetails.id,
                    message: 'Payment pending - monitoring via webhooks (API errors detected)',
                    orderStatus: orderDetails.payment_status,
                    paymentMethod: orderDetails.payment_method,
                    source: 'webhook_only',
                    consecutiveErrors: newConsecutiveErrors,
                    lastError: payPayStatus.resultInfo.code
                  });
                }
              }
            }
          }
        }
      } catch (apiError: any) {
        console.log('⚠️ PayPay API check failed:', apiError.message);
        console.log('📝 Continuing with database status - this is normal for test mode or network issues');
        
        // Update consecutive errors count
        if (orderDetails.payments && orderDetails.payments.length > 0) {
          const paymentRecord = orderDetails.payments[0];
          const providerResponse = paymentRecord.provider_response || {};
          const consecutiveErrors = (providerResponse.consecutive_api_errors || 0) + 1;
          
          await updatePaymentRecord(paymentRecord.id, {
            provider_response: {
              ...paymentRecord.provider_response,
              consecutive_api_errors: consecutiveErrors,
              last_api_error: 'NETWORK_ERROR',
              last_api_error_time: new Date().toISOString(),
              last_api_check: new Date().toISOString()
            }
          });
        }
      }

      // Default: still pending
            return res.status(200).json({
                status: 'pending',
        orderId: orderDetails.id,
        message: 'Payment is still pending. Please complete payment in PayPay app.',
        orderStatus: orderDetails.payment_status,
        paymentMethod: orderDetails.payment_method
      });

    } catch (error: any) {
      console.error('❌ Payment status check error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Error checking payment status',
        error: error.message
      });
    }
  } else if (req.method === 'POST') {
    // Handle manual payment actions (for testing)
    const { orderId, action } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Missing orderId' });
    }

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    try {
      console.log(`🔧 Manual payment action: ${action} for order: ${orderId}`);

      // Get order details from database
      const orderDetails = await getOrderWithPayments(parseInt(orderId as string));

      if (!orderDetails) {
        console.log('❌ Order not found:', orderId);
        return res.status(404).json({ 
          status: 'not_found',
          message: 'Order not found' 
        });
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
        
        return res.status(200).json({
          status: 'completed',
          orderId: orderDetails.id,
          message: 'Payment manually completed for testing',
          method: orderDetails.payment_method,
          source: 'manual_force_complete'
        });
      }

      return res.status(400).json({ error: 'Invalid action' });

    } catch (error: any) {
      console.error('Manual payment action error:', error);
      return res.status(500).json({ 
        error: 'Failed to process manual payment action',
        details: error.message 
      });
    }
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
