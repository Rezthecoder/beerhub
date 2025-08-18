import { useState } from 'react';
import Layout from '../components/Layout';
import PayPayCheckout from '../components/PayPayCheckout';
import UnifiedPaymentCheckout from '../components/UnifiedPaymentCheckout';

export default function TestPayPayPage() {
    const [amount, setAmount] = useState(1000);
    const [showUnified, setShowUnified] = useState(false);

    const handlePayPaySuccess = (paymentId: string) => {
        console.log('PayPay payment created successfully:', paymentId);
        alert(`PayPay payment created! Payment ID: ${paymentId}`);
    };

    const handlePayPayError = (error: string) => {
        console.error('PayPay payment error:', error);
        alert(`PayPay error: ${error}`);
    };

    const handleUnifiedSuccess = (paymentId: string, method: string) => {
        console.log(`${method} payment created successfully:`, paymentId);
        alert(`${method} payment created! Payment ID: ${paymentId}`);
    };

    const handleUnifiedError = (error: string) => {
        console.error('Payment error:', error);
        alert(`Payment error: ${error}`);
    };

    return (
        <Layout title="Test PayPay - BeerHub">
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-lg-8">
                        <div className="card shadow">
                            <div className="card-header bg-info text-white">
                                <h4 className="mb-0">🧪 Test PayPay Integration</h4>
                            </div>
                            <div className="card-body">
                                <div className="mb-4">
                                    <h5>💰 Payment Amount</h5>
                                    <div className="input-group">
                                        <span className="input-group-text">¥</span>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={amount}
                                            onChange={(e) => setAmount(parseInt(e.target.value) || 1000)}
                                            min="100"
                                            step="100"
                                        />
                                    </div>
                                    <small className="text-muted">Amount in yen (minimum ¥100)</small>
                                </div>

                                <div className="mb-4">
                                    <div className="d-flex gap-2 mb-3">
                                        <button
                                            className={`btn ${!showUnified ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setShowUnified(false)}
                                        >
                                            PayPay Only
                                        </button>
                                        <button
                                            className={`btn ${showUnified ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setShowUnified(true)}
                                        >
                                            Unified (Stripe + PayPay)
                                        </button>
                                    </div>
                                </div>

                                {!showUnified ? (
                                    <div>
                                        <h5>📱 PayPay Checkout</h5>
                                        <PayPayCheckout
                                            amount={amount}
                                            currency="JPY"
                                            onSuccess={handlePayPaySuccess}
                                            onError={handlePayPayError}
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <h5>🔄 Unified Payment Checkout</h5>
                                        <UnifiedPaymentCheckout
                                            amount={amount}
                                            currency="JPY"
                                            onSuccess={handleUnifiedSuccess}
                                            onError={handleUnifiedError}
                                        />
                                    </div>
                                )}

                                <div className="mt-4">
                                    <h5>🔧 Environment Variables Required</h5>
                                    <div className="alert alert-warning">
                                        <p className="mb-2">Make sure these environment variables are set:</p>
                                        <ul className="mb-0">
                                            <li><code>PAYPAY_API_KEY</code> - Your PayPay API key</li>
                                            <li><code>PAYPAY_SECRET</code> - Your PayPay secret</li>
                                            <li><code>PAYPAY_MERCHANT_ID</code> - Your PayPay merchant ID</li>
                                            <li><code>STRIPE_SECRET_KEY</code> - Your Stripe secret key (for unified checkout)</li>
                                            <li><code>NEXT_PUBLIC_BASE_URL</code> - Your base URL (e.g., http://localhost:3000)</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h5>📋 How It Works</h5>
                                    <ol>
                                        <li>Select payment method (PayPay or Unified)</li>
                                        <li>Set the payment amount</li>
                                        <li>Click "Create Payment" button</li>
                                        <li>PayPay will create a QR code payment</li>
                                        <li>You'll get a redirect URL to complete payment</li>
                                    </ol>
                                </div>

                                <div className="mt-4">
                                    <h5>🔗 Test Links</h5>
                                    <div className="d-flex gap-2">
                                        <a href="/checkout?productId=1&quantity=1" className="btn btn-outline-primary">
                                            Go to Checkout Page
                                        </a>
                                        <a href="/" className="btn btn-outline-secondary">
                                            Back to Home
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
