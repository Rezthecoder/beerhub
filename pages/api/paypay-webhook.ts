import type { NextApiRequest, NextApiResponse } from 'next';
import { isOurMerchantPaymentId } from '../../lib/paypay';
import { reconcilePayPayPayment } from '../../lib/paypay-orders';

/**
 * POST /api/paypay-webhook  (set this URL in the PayPay developer dashboard)
 *
 * The webhook body is only used to learn WHICH payment changed. Whether it was paid is always
 * confirmed by asking PayPay's API, so a forged webhook can't mark an order as paid.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const mpid: unknown = body.merchant_order_id ?? body.merchantPaymentId ?? body.merchant_payment_id;

  if (typeof mpid !== 'string' || !isOurMerchantPaymentId(mpid)) {
    // Acknowledge so PayPay doesn't keep retrying notifications that aren't ours
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    const status = await reconcilePayPayPayment(mpid);
    return res.status(200).json({ received: true, state: status.state });
  } catch (error: any) {
    console.error('PayPay webhook reconcile failed:', error?.message);
    // 500 tells PayPay to retry later
    return res.status(500).json({ received: true, error: 'retry' });
  }
}
