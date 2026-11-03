/**
 * Glue between PayPay payments and the orders table. Server-only.
 *
 * The database is optional for the demo: if Supabase is unavailable the payment still works,
 * and the receipt is built from PayPay's own payment record.
 */
import type { NextApiRequest } from 'next';
import { createOrder, createPaymentRecord, getOrderWithPayments, updateOrderPaymentStatus } from './products';
import { getPaymentStatus, orderIdFromMerchantPaymentId, type PayPayStatus } from './paypay';

/** Where PayPay should send the customer back to: the address they are actually using. */
export function siteOrigin(req: NextApiRequest): string {
  const forwardedHost = req.headers['x-forwarded-host'];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host;
  if (host) {
    const forwardedProto = req.headers['x-forwarded-proto'];
    const proto =
      (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ||
      (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
    return `${proto.split(',')[0]}://${host}`;
  }
  return (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
}

/** Saves the order if the database is reachable; returns null (and carries on) if it isn't. */
export async function tryCreatePayPayOrder(input: {
  productId: number;
  quantity: number;
  totalAmount: number;
  customerEmail?: string;
}): Promise<number | null> {
  try {
    const order = await createOrder({
      product_id: input.productId,
      quantity: input.quantity,
      total_amount: input.totalAmount,
      customer_email: input.customerEmail || undefined,
    });
    if (!order) return null;
    await createPaymentRecord({
      order_id: order.id,
      payment_method: 'paypay',
      amount: input.totalAmount,
      currency: 'JPY',
      status: 'pending',
    });
    return order.id;
  } catch (error: any) {
    console.warn('Order not saved (database unavailable), continuing with PayPay only:', error?.message);
    return null;
  }
}

/**
 * Asks PayPay for the payment's status and, when it is final, records it on the order.
 * Safe to call repeatedly (polling, webhook, success page).
 */
export async function reconcilePayPayPayment(merchantPaymentId: string): Promise<PayPayStatus & { orderId: number | null }> {
  const status = await getPaymentStatus(merchantPaymentId);
  const orderId = orderIdFromMerchantPaymentId(merchantPaymentId);

  if (orderId && status.state !== 'pending') {
    try {
      const order = await getOrderWithPayments(orderId);
      if (order && order.payment_status !== 'completed') {
        if (status.state === 'paid') {
          // Only accept the payment if PayPay charged the amount we asked for
          if (status.amount === order.total_amount) {
            await updateOrderPaymentStatus(orderId, 'completed', status.paymentId, 'paypay', status.amount);
          } else {
            console.error(`PayPay amount ${status.amount} does not match order ${orderId} total ${order.total_amount}`);
          }
        } else {
          await updateOrderPaymentStatus(orderId, 'failed', status.paymentId, 'paypay');
        }
      }
    } catch (error: any) {
      console.warn('Could not update order (database unavailable):', error?.message);
    }
  }

  return { ...status, orderId };
}
