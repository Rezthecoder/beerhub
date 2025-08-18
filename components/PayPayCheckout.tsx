import { useEffect, useState } from 'react';

interface PayPayCheckoutProps {
    amount: number;
    currency?: string;
    onSuccess?: (paymentId: string) => void;
    onError?: (error: string) => void;
}

export default function PayPayCheckout({
    amount,
    currency = 'JPY',
    onSuccess,
    onError
}: PayPayCheckoutProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [payPayUrl, setPayPayUrl] = useState<string | null>(null);
    const [paymentId, setPaymentId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create PayPay payment
    const createPayPayPayment = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/create-paypay', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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
                if (onSuccess) {
                    onSuccess(result.paymentId);
                }
            } else {
                const errorMessage = result.error || 'PayPay payment creation failed';
                setError(errorMessage);
                if (onError) {
                    onError(errorMessage);
                }
            }
        } catch (err: any) {
            const errorMessage = 'Failed to create PayPay payment';
            setError(errorMessage);
            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (payPayUrl) {
            // Redirect to PayPay payment page
            window.location.href = payPayUrl;
        } else {
            // Create new PayPay payment
            await createPayPayPayment();
        }
    };

    return (
        <div className="paypay-checkout">
            <form onSubmit={handleSubmit}>
                <div className="payment-element">
                    {!payPayUrl ? (
                        <div className="text-center p-4">
                            {isLoading ? (
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            ) : (
                                <div>
                                    <h6>📱 PayPay Payment</h6>
                                    <p className="mb-3">
                                        Amount: ¥{amount.toLocaleString()} {currency}
                                    </p>
                                    <button
                                        type="submit"
                                        className="btn btn-primary btn-lg"
                                        disabled={isLoading}
                                    >
                                        Create PayPay Payment
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center p-4">
                            <div className="alert alert-success">
                                <h6>✅ PayPay Payment Created!</h6>
                                <p className="mb-3">
                                    Payment ID: {paymentId}<br />
                                    Amount: ¥{amount.toLocaleString()} {currency}
                                </p>
                                <button
                                    type="submit"
                                    className="btn btn-success btn-lg"
                                >
                                    Proceed to PayPay
                                </button>
                            </div>
                        </div>
                    )}
                </div>

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
