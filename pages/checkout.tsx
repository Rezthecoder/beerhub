import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../components/Layout';
import StripeCheckout from '../components/StripeCheckout';
import PayPayCheckout from '../components/PayPayCheckout';
import Toast from '../components/Toast';
import { getProductById, Product } from '../lib/products';
import { useToast } from '../hooks/useToast';

interface CheckoutPageProps {
  product: Product;
  quantity: number;
  totalAmount: number;
}

type Method = 'card' | 'paypay' | 'cod';

const METHODS: { id: Method; title: string; note: string }[] = [
  { id: 'card', title: 'Card', note: 'Stripe test mode' },
  { id: 'paypay', title: 'PayPay', note: 'PayPay sandbox' },
  { id: 'cod', title: 'Cash on delivery', note: 'Pay when it arrives' },
];

function CashOnDelivery({ product, quantity, totalAmount }: CheckoutPageProps) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', address: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      setError('Add your name, phone number and delivery address.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/create-cod-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          quantity,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          shippingAddress: form.address.trim(),
          customerEmail: form.email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.orderId) {
        throw new Error(
          res.status >= 500
            ? 'Cash on delivery needs the order database, which is offline right now. Try PayPay instead.'
            : data?.error || 'Could not place the order.'
        );
      }
      router.push(`/payment/success?orderId=${data.orderId}&method=cod`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <p className="muted">Pay ¥{totalAmount.toLocaleString()} in cash when your order arrives. In this demo nothing is delivered.</p>
      <div className="field" style={{ marginTop: '1.25rem' }}>
        <label htmlFor="cod-name">Full name</label>
        <input id="cod-name" className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="cod-phone">Phone number</label>
        <input
          id="cod-phone"
          type="tel"
          className="input"
          autoComplete="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="cod-address">Delivery address</label>
        <textarea
          id="cod-address"
          className="input"
          autoComplete="street-address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
      </div>
      <div className="field">
        <label htmlFor="cod-email">Email (optional)</label>
        <input
          id="cod-email"
          type="email"
          className="input"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      {error && (
        <p className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-lg btn-block bg-beer" style={{ marginTop: '1.5rem' }} disabled={busy}>
        {busy ? 'Placing order…' : 'Place order'}
      </button>
    </form>
  );
}

export default function CheckoutPage({ product, quantity, totalAmount }: CheckoutPageProps) {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('paypay');
  const [paypayEmail, setPaypayEmail] = useState('');
  const { toast, showError, hideToast } = useToast();

  return (
    <Layout title="Checkout - BeerHub">
      <div className="container">
        <div className="checkout-layout">
          <section className="panel brut" aria-labelledby="pay-title">
            <Link href={`/product/${product.id}`} className="back-link">
              ← Back to {product.name}
            </Link>
            <h1 id="pay-title" className="section-title">
              Checkout
            </h1>

            <fieldset style={{ border: 0, padding: 0, margin: '1.75rem 0 0' }}>
              <legend style={{ fontWeight: 800, padding: 0 }}>How do you want to pay?</legend>
              <div className="methods">
                {METHODS.map((m) => (
                  <label key={m.id} className="method">
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
                    {m.id === 'paypay' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src="/images/paypay.png" alt="PayPay" />
                    ) : (
                      <span>{m.title}</span>
                    )}
                    <small>{m.note}</small>
                  </label>
                ))}
              </div>
            </fieldset>

            {method === 'card' && (
              <StripeCheckout
                productId={product.id}
                quantity={quantity}
                totalAmount={totalAmount}
                onSuccess={(orderId) => router.push(`/payment/success?orderId=${orderId}&method=card`)}
                onError={showError}
              />
            )}

            {method === 'paypay' && (
              <>
                <div className="field">
                  <label htmlFor="paypay-email">Email for the receipt (optional)</label>
                  <input
                    id="paypay-email"
                    type="email"
                    className="input"
                    autoComplete="email"
                    value={paypayEmail}
                    onChange={(e) => setPaypayEmail(e.target.value)}
                  />
                </div>
                <div style={{ marginTop: '1.25rem' }}>
                  <PayPayCheckout productId={product.id} quantity={quantity} totalAmount={totalAmount} customerEmail={paypayEmail} />
                </div>
              </>
            )}

            {method === 'cod' && <CashOnDelivery product={product} quantity={quantity} totalAmount={totalAmount} />}
          </section>

          <aside className="panel brut bg-sand summary" aria-label="Order summary">
            <h2 style={{ fontSize: '1.5rem' }}>Your order</h2>
            <div className="summary-item" style={{ marginTop: '1.25rem' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt="" />
              <div>
                <p style={{ fontWeight: 800 }}>{product.name}</p>
                <p className="muted">
                  {quantity} × ¥{product.price.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="summary-rows">
              <div>
                <span>Subtotal</span>
                <span>¥{totalAmount.toLocaleString()}</span>
              </div>
              <div>
                <span>Delivery</span>
                <span>Free (demo)</span>
              </div>
              <div className="total">
                <span>Total</span>
                <span>¥{totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <p className="muted" style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
              Prices include tax. Demo store: no real payment is taken and nothing is shipped.
            </p>
          </aside>
        </div>
      </div>

      <Toast message={toast.message} type={toast.type} show={toast.show} onClose={hideToast} />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const productId = parseInt(query.productId as string, 10);
  const rawQty = parseInt(query.quantity as string, 10);
  const quantity = Number.isFinite(rawQty) ? Math.min(24, Math.max(1, rawQty)) : 1;

  const product = Number.isFinite(productId) ? await getProductById(productId) : null;
  if (!product) return { notFound: true };

  return {
    props: { product, quantity, totalAmount: product.price * quantity },
  };
};
