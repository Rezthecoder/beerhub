import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ReceiptGenerator, { type ReceiptData } from '../../components/ReceiptGenerator';

const METHOD_LABEL: Record<string, string> = {
  paypay: 'PayPay (sandbox)',
  stripe: 'Card (Stripe test mode)',
  card: 'Card (Stripe test mode)',
  credit_card: 'Card (Stripe test mode)',
  cod: 'Cash on delivery',
};

/** "BeerHub: Sapporo Premium Beer x 2" → { name, quantity } */
function parseDescription(description: string | null | undefined) {
  const match = /^(?:BeerHub:\s*)?(.+?)\s+x\s+(\d+)$/.exec(description || '');
  return match ? { name: match[1], quantity: Number(match[2]) } : { name: description || 'BeerHub order', quantity: 1 };
}

async function loadPayPayReceipt(mpid: string): Promise<ReceiptData> {
  const res = await fetch(`/api/paypay/status?mpid=${encodeURIComponent(mpid)}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Could not load the payment.');
  if (data.state !== 'paid') throw new Error('PayPay has not confirmed this payment.');
  const { name, quantity } = parseDescription(data.description);
  const total = Number(data.amount) || 0;
  return {
    reference: data.orderId ? `ORD-${data.orderId}` : mpid,
    items: [{ name, quantity, price: Math.round(total / quantity), total }],
    total,
    paymentMethod: METHOD_LABEL.paypay,
    paymentStatus: 'Paid',
    paymentId: data.paymentId || undefined,
    date: data.paidAt || new Date().toISOString(),
  };
}

async function loadOrderReceipt(orderId: string, method: string): Promise<ReceiptData> {
  const res = await fetch(`/api/order-details?orderId=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Could not load the order.');
  const order = data.order;
  const payment = order.payments?.[0];
  const methodKey = payment?.payment_method || order.payment_method || method;
  const paid = order.payment_status === 'completed';
  return {
    reference: `ORD-${order.id}`,
    customerEmail: order.customer_email || undefined,
    items: [
      {
        name: order.products?.name || 'BeerHub order',
        quantity: order.quantity,
        price: order.products?.price ?? Math.round(order.total_amount / order.quantity),
        total: order.total_amount,
      },
    ],
    total: order.total_amount,
    paymentMethod: METHOD_LABEL[methodKey] || methodKey,
    paymentStatus: paid ? 'Paid' : methodKey === 'cod' ? 'Pay on delivery' : 'Pending',
    paymentId: order.payment_id || undefined,
    date: order.payment_completed_at || order.created_at,
  };
}

export default function PaymentSuccess() {
  const router = useRouter();
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const { mpid, orderId, method } = router.query;
    const load =
      typeof mpid === 'string'
        ? loadPayPayReceipt(mpid)
        : typeof orderId === 'string'
          ? loadOrderReceipt(orderId, typeof method === 'string' ? method : '')
          : Promise.reject(new Error('This link is missing the order reference.'));
    load.then(setReceipt).catch((err) => setError(err.message));
  }, [router.isReady, router.query]);

  const isCod = receipt?.paymentMethod === METHOD_LABEL.cod;

  return (
    <Layout title="Thank you - BeerHub">
      <div className="container">
        <div className="result brut bg-sand" style={{ marginBottom: '2.5rem' }}>
          {!receipt && !error && (
            <>
              <div style={{ display: 'grid', placeItems: 'center', marginBottom: '1.5rem' }}>
                <div className="spinner" aria-hidden="true" />
              </div>
              <h1>Loading your order…</h1>
            </>
          )}
          {receipt && (
            <>
              <span className="badge-icon bg-mint" aria-hidden="true">
                ✓
              </span>
              <h1>{isCod ? 'Order placed' : 'Payment complete'}</h1>
              <p>
                {isCod
                  ? `Thanks! You'd pay ¥${receipt.total.toLocaleString()} on delivery.`
                  : `Thanks! ¥${receipt.total.toLocaleString()} was paid with ${receipt.paymentMethod}.`}{' '}
                This is a demo, so nothing will be shipped.
              </p>
              <div className="actions">
                <Link href="/#beers" className="btn bg-beer">
                  Keep shopping
                </Link>
              </div>
            </>
          )}
          {error && (
            <>
              <span className="badge-icon bg-coral-soft" aria-hidden="true">
                !
              </span>
              <h1>We couldn&apos;t load this order</h1>
              <p>{error}</p>
              <div className="actions">
                <Link href="/" className="btn bg-beer">
                  Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      {receipt && <ReceiptGenerator receiptData={receipt} />}
    </Layout>
  );
}
