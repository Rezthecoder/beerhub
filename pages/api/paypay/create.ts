import type { NextApiRequest, NextApiResponse } from 'next';
import { getProductById } from '../../../lib/products';
import { createQRCode, newMerchantPaymentId, PayPayError } from '../../../lib/paypay';
import { siteOrigin, tryCreatePayPayOrder } from '../../../lib/paypay-orders';

/**
 * POST /api/paypay/create  { productId, quantity, customerEmail? }
 * Creates a PayPay payment for the product. The price always comes from the catalogue, never from the browser.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const productId = Number(req.body?.productId);
  const quantity = Number(req.body?.quantity ?? 1);
  const customerEmail = typeof req.body?.customerEmail === 'string' ? req.body.customerEmail.trim().slice(0, 200) : '';

  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Choose a product first.' });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 24) {
    return res.status(400).json({ error: 'Quantity must be between 1 and 24.' });
  }

  const product = await getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: 'That product is no longer available.' });
  }

  const totalAmount = product.price * quantity;
  const orderId = await tryCreatePayPayOrder({ productId: product.id, quantity, totalAmount, customerEmail });
  const merchantPaymentId = newMerchantPaymentId(orderId);
  const origin = siteOrigin(req);

  try {
    const qr = await createQRCode({
      merchantPaymentId,
      amount: totalAmount,
      description: `BeerHub: ${product.name} x ${quantity}`,
      redirectUrl: `${origin}/payment/callback?mpid=${encodeURIComponent(merchantPaymentId)}`,
      userAgent: req.headers['user-agent'],
    });

    return res.status(200).json({
      merchantPaymentId,
      orderId,
      amount: totalAmount,
      paymentUrl: qr.url,
      deeplink: qr.deeplink,
      expiresAt: qr.expiresAt,
    });
  } catch (error: any) {
    const code = error instanceof PayPayError ? error.code : 'UNKNOWN';
    console.error('PayPay create failed:', code, error?.message);
    const message =
      code === 'NOT_CONFIGURED'
        ? 'PayPay is not set up on this demo yet. Please try card payment instead.'
        : 'PayPay could not start the payment. Please try again in a moment.';
    return res.status(code === 'NOT_CONFIGURED' ? 503 : 502).json({ error: message, code });
  }
}
