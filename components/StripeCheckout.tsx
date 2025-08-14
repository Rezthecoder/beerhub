import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/router';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripeCheckoutFormProps {
    productId: number;
    quantity: number;
    totalAmount: number;
    onSuccess: (orderId: string) => void;
    onError: (error: string) => void;
}

function CheckoutForm({ productId, quantity, totalAmount, onSuccess, onError }: StripeCheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
    });

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        if (!customerInfo.name || !customerInfo.email) {
            onError('Please fill in your name and email');
            return;
        }

        setIsProcessing(true);

        try {
            // Create Payment Intent
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId,
                    quantity,
                    customerEmail: customerInfo.email,
                }),
            });

            const { clientSecret, orderId } = await response.json();

            if (!response.ok) {
                throw new Error('Failed to create payment intent');
            }

            // Confirm payment with Stripe
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                    billing_details: {
                        name: customerInfo.name,
                        email: customerInfo.email,
                    },
                },
            });

            if (error) {
                onError(error.message || 'Payment failed');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                onSuccess(orderId);
            }
        } catch (err: any) {
            onError(err.message || 'Payment processing failed');
        } finally {
            setIsProcessing(false);
        }
    };

    const cardElementOptions = {
        style: {
            base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                    color: '#aab7c4',
                },
            },
            invalid: {
                color: '#9e2146',
            },
        },
    };

    return (
        <form onSubmit={handleSubmit} className="stripe-form">
            <div className="mb-3">
                <label className="form-label">Name *</label>
                <input
                    type="text"
                    className="form-control"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="John Doe"
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Email *</label>
                <input
                    type="email"
                    className="form-control"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                />
            </div>

            <div className="mb-3">
                <label className="form-label">Card Information *</label>
                <div className="form-control" style={{ padding: '12px' }}>
                    <CardElement options={cardElementOptions} />
                </div>
                <small className="text-muted">
                    Test cards: 4242 4242 4242 4242 (Success) | 4000 0000 0000 0002 (Decline)
                </small>
            </div>

            <button
                type="submit"
                className="btn btn-warning btn-lg w-100 fw-bold"
                disabled={!stripe || isProcessing}
            >
                {isProcessing ? (
                    <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Processing Payment...
                    </>
                ) : (
                    <>🔒 Pay ¥{totalAmount.toLocaleString()}</>
                )}
            </button>

            <div className="text-center mt-2">
                <small className="text-muted">
                    🔒 Your payment information is secure and encrypted by Stripe
                </small>
            </div>
        </form>
    );
}

interface StripeCheckoutProps {
    productId: number;
    quantity: number;
    totalAmount: number;
    onSuccess: (orderId: string) => void;
    onError: (error: string) => void;
}

export default function StripeCheckout({ productId, quantity, totalAmount, onSuccess, onError }: StripeCheckoutProps) {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutForm
                productId={productId}
                quantity={quantity}
                totalAmount={totalAmount}
                onSuccess={onSuccess}
                onError={onError}
            />
        </Elements>
    );
}