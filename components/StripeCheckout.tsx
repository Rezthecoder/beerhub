import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutProps {
  productId: number;
  quantity: number;
  totalAmount: number;
  onSuccess: (orderId: string) => void;
  onError: (error: string) => void;
}

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '16px',
      color: '#111827',
      fontFamily: 'system-ui, sans-serif',
      '::placeholder': { color: '#6b7280' },
    },
    invalid: { color: '#b91c1c' },
  },
};

function CheckoutForm({ productId, quantity, totalAmount, onSuccess, onError }: StripeCheckoutProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    if (!name.trim() || !email.trim()) {
      onError('Add your name and email to pay by card.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, customerEmail: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.error === 'Failed to create order'
            ? 'Card payments need the order database, which is offline right now. Try PayPay instead.'
            : data?.error || 'Could not start the card payment.'
        );
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: { name: name.trim(), email: email.trim() },
        },
      });

      if (error) {
        onError(error.message || 'The card payment did not go through.');
      } else if (paymentIntent?.status === 'succeeded') {
        onSuccess(String(data.orderId));
      }
    } catch (err: any) {
      onError(err.message || 'The card payment did not go through.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="field">
        <label htmlFor="card-name">Name on card</label>
        <input id="card-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="cc-name" required />
      </div>
      <div className="field">
        <label htmlFor="card-email">Email for the receipt</label>
        <input
          id="card-email"
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </div>
      <div className="field">
        <span className="label">Card</span>
        <div className="card-element">
          <CardElement options={CARD_STYLE} />
        </div>
        <span className="hint">Test card 4242 4242 4242 4242 succeeds; 4000 0000 0000 0002 is declined.</span>
      </div>
      <button type="submit" className="btn btn-lg btn-block bg-beer" style={{ marginTop: '1.5rem' }} disabled={!stripe || isProcessing}>
        {isProcessing ? (
          <>
            <span className="spinner spinner-sm" aria-hidden="true" /> Paying…
          </>
        ) : (
          <>Pay ¥{totalAmount.toLocaleString()} by card</>
        )}
      </button>
    </form>
  );
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
