import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../components/Layout';
import StripeCheckout from '../components/StripeCheckout';
import Toast from '../components/Toast';
import PayPayLogo from '../components/PayPayLogo';
import { getProductById, Product } from '../lib/products';
import { useToast } from '../hooks/useToast';

interface CheckoutPageProps {
    product: Product;
    quantity: number;
    totalAmount: number;
}

export default function CheckoutPage({ product, quantity, totalAmount }: CheckoutPageProps) {
    const router = useRouter();
    const [selectedPayment, setSelectedPayment] = useState<string>('credit');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast, showSuccess, showError, hideToast } = useToast();

    const [payPayQRCode, setPayPayQRCode] = useState<string | null>(null);
    const [payPayPaymentId, setPayPayPaymentId] = useState<string | null>(null);
    const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

    const handlePayPayPayment = async () => {
        try {
            setIsProcessing(true);
            showSuccess('Creating PayPay QR Code...');

            const response = await fetch('/api/create-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: product.id,
                    quantity,
                    customerEmail: '', // Can be added later if needed
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'PayPay payment failed');
            }

            // Show QR code instead of redirecting
            if (result.webPaymentUrl || result.qrCodeUrl) {
                setPayPayQRCode(result.webPaymentUrl || result.qrCodeUrl);
                setPayPayPaymentId(result.paymentId);
                setCurrentOrderId(result.orderId);
                showSuccess('PayPay QR Code generated! Scan with your PayPay app.');

                // Start polling for payment status
                startPaymentStatusPolling(result.orderId, result.merchantPaymentId);
            } else {
                console.error('PayPay API Response:', result);
                throw new Error(`PayPay QR code not available. ${result.message || 'Please check PayPay configuration.'}`);
            }

        } catch (error: any) {
            console.error('PayPay payment error:', error);
            showError(`PayPay Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // Store the current polling interval to stop it when starting a new one
    const [currentPollInterval, setCurrentPollInterval] = useState<NodeJS.Timeout | null>(null);

    const startPaymentStatusPolling = (orderId: string, merchantPaymentId: string) => {
        // PayPay Payment Status Polling Strategy:
        // - Poll every 4.5 seconds (following PayPay's 4-5 second recommendation)
        // - Check both database status and PayPay API for real-time updates
        // - Stop polling after 10 minutes to prevent infinite loops
        // - Handle network errors gracefully without stopping the poll
        // - Update payment records with PayPay API responses for better tracking
        // Stop any existing polling first
        if (currentPollInterval) {
            clearInterval(currentPollInterval);
            console.log('🛑 Stopped previous polling instance');
        }

        console.log('🚀 Starting payment status polling for:', { orderId, merchantPaymentId });

        const pollInterval = setInterval(async () => {
            try {
                console.log('🔄 Polling payment status for Order', orderId);
                const response = await fetch(`/api/check-payment-status?orderId=${orderId}`);
                const result = await response.json();

                console.log('📋 Payment status check result for Order', orderId, ':', result);

                if (result.status === 'completed') {
                    clearInterval(pollInterval);
                    console.log('🎉 Payment completed! Stopping polling and redirecting...');
                    showSuccess('Payment completed! Redirecting...');
                    setTimeout(() => {
                        router.push(`/payment/success?orderId=${orderId}&method=paypay`);
                    }, 1500);
                } else if (result.status === 'failed') {
                    clearInterval(pollInterval);
                    console.log('❌ Payment failed! Stopping polling...');
                    showError('Payment failed. Please try again.');
                    setPayPayQRCode(null);
                    setPayPayPaymentId(null);
                } else if (result.status === 'error') {
                    clearInterval(pollInterval);
                    console.log('🚨 Payment error! Stopping polling...');
                    showError(`Payment error: ${result.message}`);
                    setPayPayQRCode(null);
                    setPayPayPaymentId(null);
                } else {
                    console.log('⏳ Payment still pending, continuing to poll...');
                }
                // If status is 'pending', continue polling
            } catch (error) {
                console.error('Payment status check error:', error);
                // Don't stop polling on network errors, just log them
            }
        }, 4500); // Check every 4.5 seconds (following PayPay's 4-5 second recommendation)

        // Store the interval reference
        setCurrentPollInterval(pollInterval);

        // Stop polling after 10 minutes
        setTimeout(() => {
            clearInterval(pollInterval);
            setCurrentPollInterval(null);
            console.log('⏰ Payment status polling stopped after 10 minutes');
        }, 600000);
    };





    return (
        <Layout title="Checkout - BeerHub">
            <div className="container py-3 py-md-5">
                <div className="row justify-content-center">
                    <div className="col-12 col-lg-8">
                        <div className="card shadow">
                            <div className="card-header bg-warning text-dark">
                                <h4 className="mb-0 fs-5 fs-md-4">🍺 Secure Checkout</h4>
                            </div>
                            <div className="card-body p-3 p-md-4">
                                {/* Order Summary */}
                                <div className="order-summary mb-4 p-3 bg-light rounded">
                                    <h5 className="mb-3 fs-6 fs-md-5">Order Summary</h5>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span className="text-break">{product.name}</span>
                                        <span className="ms-2 text-nowrap">¥{product.price.toLocaleString()}</span>
                                    </div>
                                    <div className="d-flex justify-content-between mb-2">
                                        <span>Quantity</span>
                                        <span>{quantity}</span>
                                    </div>
                                    <hr className="my-2" />
                                    <div className="d-flex justify-content-between fw-bold fs-6 fs-md-5">
                                        <span>Total</span>
                                        <span className="text-warning">¥{totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Payment Method Selection */}
                                <div className="payment-methods mb-4">
                                    <h5 className="mb-3 fs-6 fs-md-5">Choose Payment Method</h5>
                                    <div className="row g-2">
                                        <div className="col-12 col-md-4 mb-2">
                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="payment"
                                                id="credit"
                                                checked={selectedPayment === 'credit'}
                                                onChange={() => setSelectedPayment('credit')}
                                            />
                                            <label className="btn btn-outline-primary w-100 py-3" htmlFor="credit">
                                                <span className="d-block">💳</span>
                                                <span className="small">Credit Card</span>
                                            </label>
                                        </div>
                                        <div className="col-12 col-md-4 mb-2">
                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="payment"
                                                id="paypay"
                                                checked={selectedPayment === 'paypay'}
                                                onChange={() => setSelectedPayment('paypay')}
                                            />
                                            <label
                                                className="btn w-100 p-0 d-flex align-items-stretch justify-content-center"
                                                htmlFor="paypay"
                                                style={{
                                                    height: '100%',
                                                    border: selectedPayment === 'paypay' ? '2px solid #dc3545' : '1px solid #dc3545',
                                                    boxShadow: selectedPayment === 'paypay' ? '0 0 0 0.2rem rgba(220,53,69,.25)' : undefined,
                                                    minHeight: 70,
                                                    padding: 0,
                                                    background: 'none'
                                                }}
                                            >
                                                <img
                                                    src="/images/paypay.png"
                                                    alt="PayPay"
                                                    style={{
                                                        width: '100%',
                                                        height: '70px',
                                                        objectFit: 'cover',
                                                        display: 'block',
                                                        borderRadius: '0.375rem'
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <div className="col-12 col-md-4 mb-2">
                                            <input
                                                type="radio"
                                                className="btn-check"
                                                name="payment"
                                                id="cod"
                                                checked={selectedPayment === 'cod'}
                                                onChange={() => setSelectedPayment('cod')}
                                            />
                                            <label className="btn btn-outline-success w-100 py-3" htmlFor="cod">
                                                <span className="d-block">💰</span>
                                                <span className="small">Cash on Delivery</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Card Form with Stripe */}
                                {selectedPayment === 'credit' && (
                                    <div className="payment-form">
                                        <h6 className="mb-3 fs-6">💳 Credit Card Information</h6>
                                        <StripeCheckout
                                            productId={product.id}
                                            quantity={quantity}
                                            totalAmount={totalAmount}
                                            onSuccess={(orderId) => {
                                                showSuccess('Payment successful! Redirecting...');
                                                setTimeout(() => {
                                                    router.push(`/payment/success?orderId=${orderId}&method=credit_card`);
                                                }, 1500);
                                            }}
                                            onError={(error) => {
                                                showError(error);
                                            }}
                                        />
                                    </div>
                                )}


                                {/* PayPay Payment */}
                                {selectedPayment === 'paypay' && (
                                    <div className="text-center">
                                        {!payPayQRCode ? (
                                            <>
                                                <button
                                                    onClick={handlePayPayPayment}
                                                    className="btn btn-danger btn-lg w-100 fw-bold d-flex align-items-center justify-content-center py-3"
                                                    disabled={isProcessing}
                                                >
                                                    {isProcessing ? (
                                                        <>
                                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                            <span className="d-none d-sm-inline">Creating QR Code...</span>
                                                            <span className="d-sm-none">Creating...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <PayPayLogo width={80} height={32} className="me-2 d-none d-sm-inline" />
                                                            <PayPayLogo width={60} height={24} className="me-2 d-sm-none" />
                                                            <span className="d-none d-sm-inline">Generate QR Code - ¥{totalAmount.toLocaleString()}</span>
                                                            <span className="d-sm-none">Generate QR - ¥{totalAmount.toLocaleString()}</span>
                                                        </>
                                                    )}
                                                </button>
                                                <small className="text-muted d-block mt-2">
                                                    Click to generate PayPay QR code for payment
                                                </small>
                                            </>
                                        ) : (
                                            <div className="paypay-qr-section">
                                                <div className="alert alert-info">
                                                    <h6 className="mb-3 fs-6">📱 Scan QR Code with PayPay App</h6>
                                                    <div className="text-center mb-3">
                                                        <div className="qr-code-container p-2 p-md-3 bg-white rounded border d-inline-block">
                                                            <img
                                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payPayQRCode)}`}
                                                                alt="PayPay QR Code"
                                                                className="img-fluid"
                                                                style={{
                                                                    maxWidth: 'min(200px, 80vw)',
                                                                    maxHeight: 'min(200px, 80vw)',
                                                                    width: 'auto',
                                                                    height: 'auto'
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="mt-2">
                                                            <small className="text-muted">
                                                                Scan this QR code with your PayPay app to complete payment
                                                            </small>
                                                        </div>
                                                    </div>
                                                    <div className="row text-start">
                                                        <div className="col-6">
                                                            <p className="mb-2 small">
                                                                <strong>Amount:</strong><br />
                                                                ¥{totalAmount.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div className="col-6">
                                                            <p className="mb-2 small">
                                                                <strong>Order ID:</strong><br />
                                                                {currentOrderId || 'Loading...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <small className="text-muted d-block">
                                                        Waiting for payment confirmation... This page will automatically update when payment is completed.
                                                    </small>
                                                    <div className="mt-3">
                                                        <div className="alert alert-info small">
                                                            <strong>🚀 Webhook-Enabled Payment Flow:</strong><br />
                                                            1. Complete payment in your PayPay app<br />
                                                            2. PayPay will automatically notify our server via webhook<br />
                                                            3. Page will auto-update when payment is detected<br />
                                                            <small className="text-muted">Real-time updates via PayPay webhooks + polling backup</small>
                                                        </div>

                                                        {/* Current Order Status */}
                                                        <div className="alert alert-secondary small">
                                                            <strong>📋 Current Order Status:</strong><br />
                                                            <strong>Order ID:</strong> {currentOrderId || 'Creating...'}<br />
                                                            <strong>Status:</strong> <span className="badge bg-warning">Pending</span><br />
                                                            <strong>Webhook URL:</strong> <small className="text-muted d-none d-md-inline">https://fe3c11d1c905.ngrok-free.app/api/paypay-webhook</small>
                                                            <small className="text-muted d-md-none">Webhook configured</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="d-flex flex-column flex-sm-row gap-2 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            setPayPayQRCode(null);
                                                            setPayPayPaymentId(null);
                                                        }}
                                                        className="btn btn-outline-secondary flex-fill py-2"
                                                    >
                                                        <span className="d-none d-sm-inline">Cancel & Generate New QR Code</span>
                                                        <span className="d-sm-none">Cancel</span>
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                showSuccess('Checking payment status...');
                                                                console.log('🔍 Checking payment status for:', { currentOrderId, payPayPaymentId });

                                                                const response = await fetch(`/api/check-payment-status?orderId=${currentOrderId}`);
                                                                const data = await response.json();

                                                                console.log('📋 Payment status response:', data);

                                                                if (data.status === 'completed') {
                                                                    showSuccess('Payment completed! Redirecting...');
                                                                    setTimeout(() => {
                                                                        router.push(`/payment/success?orderId=${currentOrderId}&method=paypay`);
                                                                    }, 1500);
                                                                } else if (data.status === 'failed') {
                                                                    showError('Payment failed. Please try again.');
                                                                    setPayPayQRCode(null);
                                                                    setPayPayPaymentId(null);
                                                                } else {
                                                                    showError(`Payment not completed yet. Status: ${data.status}. Message: ${data.message}`);
                                                                }
                                                            } catch (error: any) {
                                                                console.error('Error checking payment status:', error);
                                                                showError('Failed to check payment status');
                                                            }
                                                        }}
                                                        className="btn btn-info btn-sm me-2"
                                                        disabled={!currentOrderId}
                                                    >
                                                        🔍 Check Payment Status
                                                    </button>

                                                    {/* Manual Success Button for Testing */}
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                if (!currentOrderId) {
                                                                    showError('No order ID available');
                                                                    return;
                                                                }

                                                                showSuccess('Manually completing payment...');

                                                                const response = await fetch('/api/check-payment-status', {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Content-Type': 'application/json',
                                                                    },
                                                                    body: JSON.stringify({
                                                                        orderId: currentOrderId,
                                                                        action: 'force_complete'
                                                                    }),
                                                                });

                                                                const data = await response.json();

                                                                if (response.ok && data.status === 'completed') {
                                                                    showSuccess('Payment manually completed! Redirecting...');
                                                                    setTimeout(() => {
                                                                        router.push(`/payment/success?orderId=${currentOrderId}&method=paypay`);
                                                                    }, 1500);
                                                                } else {
                                                                    showError('Failed to manually complete payment');
                                                                }
                                                            } catch (error: any) {
                                                                console.error('Error manually completing payment:', error);
                                                                showError('Failed to manually complete payment');
                                                            }
                                                        }}
                                                        className="btn btn-success btn-sm me-2"
                                                        disabled={!currentOrderId}
                                                        title="Force complete payment for testing"
                                                    >
                                                        ✅ Force Complete
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            showSuccess('Simulating payment completion...');
                                                            setTimeout(() => {
                                                                router.push(`/payment/success?orderId=demo&method=paypay`);
                                                            }, 1500);
                                                        }}
                                                        className="btn btn-success flex-fill py-2"
                                                    >
                                                        <span className="d-none d-sm-inline">🧪 Test Complete Payment</span>
                                                        <span className="d-sm-none">🧪 Test</span>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Cash on Delivery */}
                                {selectedPayment === 'cod' && (
                                    <div className="text-center">
                                        <div className="alert alert-info">
                                            <h6 className="fs-6">💰 Cash on Delivery</h6>
                                            <p className="mb-0">Pay ¥{totalAmount.toLocaleString()} when your order is delivered.</p>
                                            <small>Delivery fee: ¥300 (Free for orders over ¥2,000)</small>
                                        </div>
                                        <button className="btn btn-success btn-lg w-100 fw-bold py-3">
                                            📦 Place COD Order
                                        </button>
                                    </div>
                                )}

                                <div className="text-center mt-3">
                                    <small className="text-muted">
                                        🔒 Your payment information is secure and encrypted
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Toast
                message={toast.message}
                type={toast.type}
                show={toast.show}
                onClose={hideToast}
            />
        </Layout>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
    const productId = parseInt(query.productId as string);
    const quantity = parseInt(query.quantity as string) || 1;

    const product = await getProductById(productId);

    if (!product) {
        return {
            notFound: true,
        };
    }

    const totalAmount = product.price * quantity;

    return {
        props: {
            product,
            quantity,
            totalAmount,
        },
    };
};