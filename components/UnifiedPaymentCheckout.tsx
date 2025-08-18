import { useEffect, useState } from 'react';

interface UnifiedPaymentCheckoutProps {
    amount: number;
    currency?: string;
    onSuccess?: (paymentId: string, method: string) => void;
    onError?: (error: string) => void;
}

export default function UnifiedPaymentCheckout({
    amount,
    currency = 'JPY',
    onSuccess,
    onError
}: UnifiedPaymentCheckoutProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
    const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
    const [payPayUrl, setPayPayUrl] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);

    useEffect(() => {
        // Initialize payment system
        initialize();
    }, []);

    // Initialize payment system
    const initialize = async () => {
        try {
            // Check configuration
            const configResponse = await fetch('/api/config');
            const config = await configResponse.json();

            if (!config.paypayEnabled) {
                console.warn('PayPay is not configured');
            }
        } catch (error) {
            console.error('Configuration error:', error);
        }
    };

    // Create Stripe payment intent
    const createStripePaymentIntent = async () => {
        try {
            const response = await fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: [{ id: 'default', amount }],
                    amount
                }),
            });

            const result = await response.json();

            if (result.clientSecret) {
                setStripeClientSecret(result.clientSecret);
                return result.clientSecret;
            } else {
                throw new Error('No client secret received');
            }
        } catch (error: any) {
            throw new Error(`Stripe payment intent creation failed: ${error.message}`);
        }
    };

    // Create PayPay payment
    const createPayPayPayment = async () => {
        try {
            const response = await fetch('/api/create-paypay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    currency,
                    redirectUrl: `${window.location.origin}/payment/callback`
                }),
            });

            const result = await response.json();

            if (result.success) {
                setPayPayUrl(result.url);
                setPaymentId(result.paymentId);

                // Generate QR code data for browser display
                if (result.url) {
                    setQrCodeData(result.url);
                }

                return result;
            } else {
                throw new Error(result.error || 'PayPay payment creation failed');
            }
        } catch (error: any) {
            throw new Error(`PayPay payment creation failed: ${error.message}`);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            if (selectedPaymentMethod === 'external_paypay') {
                // Handle PayPay payment
                const result = await createPayPayPayment();
                if (onSuccess) {
                    onSuccess(result.paymentId, 'paypay');
                }
            } else {
                // Handle Stripe payment
                const clientSecret = await createStripePaymentIntent();
                if (onSuccess) {
                    onSuccess(clientSecret, 'stripe');
                }
            }
        } catch (err: any) {
            const errorMessage = err.message || 'Payment creation failed';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Track selected payment method
    const updateSelectedPaymentMethod = (method: string) => {
        setSelectedPaymentMethod(method);

        // Clear previous payment data when switching methods
        if (method !== 'external_paypay') {
            setPayPayUrl(null);
            setPaymentId(null);
            setQrCodeData(null);
        }
        if (method !== 'card') {
            setStripeClientSecret(null);
        }
    };

    return (
        <div>
            {/* Payment Method Selection */}
            <div className="payment-methods mb-4">
                <h5 className="mb-3">Choose Payment Method</h5>
                <div className="row g-2">
                    <div className="col-12 col-md-6 mb-2">
                        <input
                            type="radio"
                            className="btn-check"
                            name="payment"
                            id="card"
                            checked={selectedPaymentMethod === 'card'}
                            onChange={() => updateSelectedPaymentMethod('card')}
                        />
                        <label className="btn btn-outline-primary w-100 py-3" htmlFor="card">
                            <span className="d-block">💳</span>
                            <span className="small">Credit Card (Stripe)</span>
                        </label>
                    </div>
                    <div className="col-12 col-md-6 mb-2">
                        <input
                            type="radio"
                            className="btn-check"
                            name="payment"
                            id="external_paypay"
                            checked={selectedPaymentMethod === 'external_paypay'}
                            onChange={() => updateSelectedPaymentMethod('external_paypay')}
                        />
                        <label className="btn btn-outline-danger w-100 py-3" htmlFor="external_paypay">
                            <span className="d-block">📱</span>
                            <span className="small">PayPay</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handleSubmit}>
                <div id="payment-element">
                    {selectedPaymentMethod === 'external_paypay' ? (
                        // PayPay Payment Element
                        <div className="text-center p-4">
                            {!payPayUrl ? (
                                <div>
                                    <h6>📱 PayPay Payment</h6>
                                    <p className="mb-3">
                                        Amount: ¥{amount.toLocaleString()} {currency}
                                    </p>
                                </div>
                            ) : (
                                <div className="alert alert-success">
                                    <h6>✅ PayPay Payment Created!</h6>

                                    {/* QR Code Display */}
                                    {qrCodeData && (
                                        <div className="mb-3">
                                            <h6>📱 Scan QR Code with PayPay App</h6>
                                            <div className="qr-code-container p-3 bg-white rounded border d-inline-block">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData)}&format=png`}
                                                    alt="PayPay QR Code"
                                                    className="img-fluid"
                                                    style={{
                                                        maxWidth: '200px',
                                                        maxHeight: '200px'
                                                    }}
                                                />
                                            </div>
                                            <div className="mt-2">
                                                <small className="text-muted">
                                                    Scan this QR code with your PayPay app to complete payment
                                                </small>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <p className="mb-2">
                                            <strong>Payment ID:</strong> {paymentId}<br />
                                            <strong>Amount:</strong> ¥{amount.toLocaleString()} {currency}
                                        </p>
                                    </div>

                                    <div className="d-flex gap-2 justify-content-center">
                                        <a
                                            href={payPayUrl}
                                            className="btn btn-success"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            Proceed to PayPay
                                        </a>

                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setPayPayUrl(null);
                                                setPaymentId(null);
                                                setQrCodeData(null);
                                            }}
                                        >
                                            Create New Payment
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        // Stripe Payment Element
                        <div className="text-center p-4">
                            {!stripeClientSecret ? (
                                <div>
                                    <h6>💳 Stripe Payment</h6>
                                    <p className="mb-3">
                                        Amount: ¥{amount.toLocaleString()} {currency}
                                    </p>
                                </div>
                            ) : (
                                <div className="alert alert-success">
                                    <h6>✅ Stripe Payment Intent Created!</h6>
                                    <p className="mb-3">
                                        Client Secret: {stripeClientSecret.substring(0, 20)}...
                                    </p>
                                    <p className="small text-muted">
                                        Stripe Elements would be rendered here with the client secret
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    id="submit"
                    type="submit"
                    disabled={isLoading}
                    className="btn btn-primary w-100 py-3"
                >
                    <div id="spinner" className={`spinner-border spinner-border-sm me-2 ${isLoading ? '' : 'd-none'}`} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <span id="button-text">
                        {selectedPaymentMethod === 'external_paypay'
                            ? (payPayUrl ? 'Payment Created!' : 'Create PayPay Payment')
                            : (stripeClientSecret ? 'Payment Intent Created!' : 'Create Stripe Payment Intent')
                        }
                    </span>
                </button>

                {error && (
                    <div className="alert alert-danger mt-3">
                        <h6>❌ Error</h6>
                        <p className="mb-0">{error}</p>
                    </div>
                )}

                <div id="payment-message" className="hidden mt-3"></div>
            </form>
        </div>
    );
}
