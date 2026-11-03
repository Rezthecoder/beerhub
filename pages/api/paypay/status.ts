import type { NextApiRequest, NextApiResponse } from 'next';
import { isOurMerchantPaymentId, PayPayError } from '../../../lib/paypay';
import { reconcilePayPayPayment } from '../../../lib/paypay-orders';

/**
 * GET /api/paypay/status?mpid=...
 * Returns { state: 'pending' | 'paid' | 'failed', ... } straight from PayPay, and records final results on the order.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const mpid = typeof req.query.mpid === 'string' ? req.query.mpid : '';
  if (!isOurMerchantPaymentId(mpid)) {
    return res.status(400).json({ error: 'Unknown payment.' });
  }

  res.setHeader('Cache-Control', 'no-store');
  try {
    const status = await reconcilePayPayPayment(mpid);
    return res.status(200).json({
      state: status.state,
      paypayStatus: status.paypayStatus,
      merchantPaymentId: status.merchantPaymentId,
      paymentId: status.paymentId ?? null,
      amount: status.amount ?? null,
      description: status.description ?? null,
      paidAt: status.paidAt ?? null,
      orderId: status.orderId,
    });
  } catch (error: any) {
    const code = error instanceof PayPayError ? error.code : 'UNKNOWN';
    console.error('PayPay status check failed:', code, error?.message);
    return res.status(502).json({ error: 'Could not check the payment with PayPay.', code });
  }
}
