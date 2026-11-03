/**
 * PayPay "Dynamic QR" payments (sandbox while NEXT_PUBLIC_DEMO_MODE is not "false").
 *
 * Flow:
 *   1. createQRCode()   → PayPay returns a payment page URL (and a deeplink for the app)
 *   2. the customer pays on that page or by scanning the QR code with the PayPay app
 *   3. getPaymentStatus() asks PayPay whether the payment went through
 * PayPay's API is the only source of truth: nothing is marked paid from browser input.
 *
 * Server-only module.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PAYPAY = require('@paypayopa/paypayopa-sdk-node');

export type PaymentState = 'pending' | 'paid' | 'failed';

export interface PayPayStatus {
  state: PaymentState;
  /** Raw PayPay status, e.g. CREATED, COMPLETED, CANCELED, EXPIRED */
  paypayStatus: string;
  merchantPaymentId: string;
  paymentId?: string;
  amount?: number;
  description?: string;
  paidAt?: string;
}

interface SdkResult {
  STATUS?: number;
  BODY?: { resultInfo?: { code: string; message: string; codeId?: string }; data?: any };
  ERROR?: string;
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

let configured = false;

export function isPayPayConfigured(): boolean {
  return Boolean(process.env.PAYPAY_API_KEY && process.env.PAYPAY_SECRET && process.env.PAYPAY_MERCHANT_ID);
}

function sdk() {
  if (!isPayPayConfigured()) {
    throw new PayPayError(
      'PayPay is not set up: add PAYPAY_API_KEY, PAYPAY_SECRET and PAYPAY_MERCHANT_ID.',
      'NOT_CONFIGURED'
    );
  }
  if (!configured) {
    PAYPAY.Configure({
      clientId: process.env.PAYPAY_API_KEY,
      clientSecret: process.env.PAYPAY_SECRET,
      merchantId: process.env.PAYPAY_MERCHANT_ID,
      // Sandbox in demo mode. Production only when demo mode is switched off.
      productionMode: !DEMO_MODE && process.env.PAYPAY_PRODUCTION === 'true',
    });
    configured = true;
  }
  return PAYPAY;
}

export class PayPayError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'PayPayError';
  }
}

function unwrap(result: SdkResult, action: string) {
  if (result.ERROR) {
    throw new PayPayError(`Could not reach PayPay (${action}): ${result.ERROR}`, 'NETWORK');
  }
  const info = result.BODY?.resultInfo;
  if (!info) {
    throw new PayPayError(`PayPay sent an unexpected response (${action}).`, 'BAD_RESPONSE');
  }
  return { code: info.code, message: info.message, data: result.BODY?.data };
}

/** A unique id PayPay will accept (≤ 64 chars). The order id is embedded so status checks can update it. */
export function newMerchantPaymentId(orderId: number | null): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `bh-o${orderId ?? 0}-${Date.now().toString(36)}-${random}`;
}

/** Reads the order id back out of a merchantPaymentId made by newMerchantPaymentId (0 = no database order). */
export function orderIdFromMerchantPaymentId(merchantPaymentId: string): number | null {
  const match = /^bh-o(\d+)-[a-z0-9]+-[a-z0-9]+$/.exec(merchantPaymentId);
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 ? id : null;
}

export function isOurMerchantPaymentId(merchantPaymentId: string): boolean {
  return /^bh-o\d+-[a-z0-9]+-[a-z0-9]+$/.test(merchantPaymentId);
}

export async function createQRCode(input: {
  merchantPaymentId: string;
  amount: number;
  description: string;
  redirectUrl: string;
  userAgent?: string;
}): Promise<{ url: string; deeplink?: string; codeId?: string; expiresAt?: string }> {
  const payload = {
    merchantPaymentId: input.merchantPaymentId,
    amount: { amount: input.amount, currency: 'JPY' },
    codeType: 'ORDER_QR',
    orderDescription: input.description.slice(0, 255),
    isAuthorization: false,
    redirectUrl: input.redirectUrl,
    // WEB_LINK: after paying, PayPay sends the browser back to redirectUrl
    redirectType: 'WEB_LINK',
    ...(input.userAgent ? { userAgent: input.userAgent } : {}),
    // The payment page stays valid for 10 minutes
    expiryDate: Math.floor(Date.now() / 1000) + 10 * 60,
  };

  const result: SdkResult = await sdk().QRCodeCreate(payload);
  const { code, message, data } = unwrap(result, 'create payment');

  if (code !== 'SUCCESS' || !data?.url) {
    throw new PayPayError(`PayPay refused the payment: ${message} (${code})`, code);
  }

  return {
    url: data.url,
    deeplink: data.deeplink,
    codeId: data.codeId,
    expiresAt: data.expiryDate ? new Date(data.expiryDate * 1000).toISOString() : undefined,
  };
}

const PAID = new Set(['COMPLETED']);
const FAILED = new Set(['FAILED', 'CANCELED', 'EXPIRED']);

export async function getPaymentStatus(merchantPaymentId: string): Promise<PayPayStatus> {
  // The SDK fills the {merchantPaymentId} path placeholder from an array.
  const result: SdkResult = await sdk().GetCodePaymentDetails([merchantPaymentId]);
  const { code, message, data } = unwrap(result, 'check payment');

  // Code created but nobody has paid yet
  if (code === 'DYNAMIC_QR_PAYMENT_NOT_FOUND' || (code === 'SUCCESS' && !data?.status)) {
    return { state: 'pending', paypayStatus: 'CREATED', merchantPaymentId };
  }
  if (code !== 'SUCCESS') {
    throw new PayPayError(`PayPay could not check the payment: ${message} (${code})`, code);
  }

  const status: string = data.status;
  return {
    state: PAID.has(status) ? 'paid' : FAILED.has(status) ? 'failed' : 'pending',
    paypayStatus: status,
    merchantPaymentId,
    paymentId: data.paymentId,
    amount: data.amount?.amount,
    description: data.orderDescription,
    paidAt: data.acceptedAt ? new Date(data.acceptedAt * 1000).toISOString() : undefined,
  };
}
