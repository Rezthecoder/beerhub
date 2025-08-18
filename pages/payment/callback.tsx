import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PaymentStatus {
    status: 'success' | 'pending' | 'failed' | 'loading';
    message: string;
    orderId?: string;
    amount?: number;
}

export default function PaymentCallbackPage() {
    const router = useRouter();
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
        status: 'loading',
        message: 'Processing your payment...'
    });

    useEffect(() => {
        if (router.isReady) {
            const { orderId, status, amount, merchantPaymentId } = router.query;

            console.log('Payment callback received:', { orderId, status, amount, merchantPaymentId });
            console.log('Router query full:', router.query);

            // Real payment verification with PayPay API
            const verifyPayment = async () => {
                try {
                    console.log('Starting payment verification...');

                    if (!merchantPaymentId) {
                        console.log('No merchantPaymentId found in query');
                        setPaymentStatus({
                            status: 'failed',
                            message: 'Missing payment ID. Please contact support.',
                            orderId: orderId as string
                        });
                        return;
                    }

                    console.log('Calling verify-paypay-payment API with:', { merchantPaymentId, orderId });

                    // Call PayPay API to verify payment status
                    const response = await fetch('/api/verify-paypay-payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            merchantPaymentId: merchantPaymentId,
                            orderId: orderId
                        })
                    });

                    console.log('API response status:', response.status);
                    console.log('API response ok:', response.ok);

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('API response error:', errorText);
                        throw new Error(`Failed to verify payment: ${response.status} ${errorText}`);
                    }

                    const paymentData = await response.json();
                    console.log('Payment verification result:', paymentData);

                    if (paymentData.status === 'COMPLETED') {
                        console.log('Payment completed successfully');
                        setPaymentStatus({
                            status: 'success',
                            message: 'Payment completed successfully!',
                            orderId: orderId as string,
                            amount: amount ? parseInt(amount as string) : paymentData.amount
                        });
                    } else if (paymentData.status === 'FAILED' || paymentData.status === 'CANCELED') {
                        console.log('Payment failed or canceled:', paymentData.status);
                        setPaymentStatus({
                            status: 'failed',
                            message: `Payment ${paymentData.status.toLowerCase()}. Please try again.`,
                            orderId: orderId as string
                        });
                    } else {
                        console.log('Payment still pending:', paymentData.status);
                        setPaymentStatus({
                            status: 'pending',
                            message: 'Payment is being processed. Please wait...',
                            orderId: orderId as string
                        });
                    }

                } catch (error: any) {
                    console.error('Payment verification error:', error);
                    setPaymentStatus({
                        status: 'failed',
                        message: `Payment verification failed: ${error.message}`,
                        orderId: orderId as string
                    });
                }
            };

            verifyPayment();
        }
    }, [router.isReady, router.query]);

    // Responsive styles
    const containerStyle = {
        maxWidth: 'clamp(600px, 80vw, 900px)',
        width: '100%',
        margin: '0 auto',
        padding: 'clamp(20px, 4vw, 40px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        gap: '30px'
    };

    const cardStyle = {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: 'clamp(30px, 6vw, 50px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '2px solid #10b981',
        textAlign: 'center' as const,
        width: '100%'
    };

    const iconStyle = {
        fontSize: 'clamp(60px, 12vw, 80px)',
        marginBottom: '20px'
    };

    const titleStyle = {
        fontSize: 'clamp(28px, 6vw, 36px)',
        marginBottom: '15px',
        color: '#1a1a1a',
        fontWeight: 'bold'
    };

    const messageStyle = {
        fontSize: 'clamp(16px, 3vw, 18px)',
        color: '#666',
        marginBottom: '30px'
    };

    const detailsStyle = {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: 'clamp(20px, 4vw, 30px)',
        marginBottom: '30px',
        width: '100%'
    };

    const buttonStyle = {
        padding: 'clamp(12px, 3vw, 16px) 24px',
        backgroundColor: '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: 'clamp(14px, 3vw, 16px)',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.2s ease'
    };

    const renderContent = () => {
        switch (paymentStatus.status) {
            case 'loading':
                return (
                    <>
                        <div style={iconStyle}>⏳</div>
                        <h1 style={titleStyle}>Processing Payment...</h1>
                        <p style={messageStyle}>
                            Please wait while we verify your payment with PayPay.
                        </p>
                        <div style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>
                            🔄
                        </div>
                    </>
                );

            case 'success':
                return (
                    <>
                        <div style={iconStyle}>🎉</div>
                        <h1 style={titleStyle}>Payment Successful!</h1>
                        <p style={messageStyle}>
                            Thank you! Your PayPay payment has been completed successfully.
                        </p>

                        <div style={detailsStyle}>
                            <h3 style={{ marginBottom: '20px', color: '#1a1a1a' }}>
                                📋 Payment Details
                            </h3>
                            {paymentStatus.orderId && (
                                <p style={{ marginBottom: '10px' }}>
                                    <strong>Order ID:</strong> {paymentStatus.orderId}
                                </p>
                            )}
                            {paymentStatus.amount && (
                                <p style={{ marginBottom: '10px' }}>
                                    <strong>Amount:</strong> ¥{paymentStatus.amount.toLocaleString()}
                                </p>
                            )}
                            <p style={{ marginBottom: '10px' }}>
                                <strong>Payment Method:</strong> PayPay
                            </p>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <h4 style={{ marginBottom: '15px', color: '#1a1a1a' }}>🚚 What's Next?</h4>
                            <p style={{ color: '#666' }}>
                                You will receive a confirmation email shortly.
                                Your order will be processed and shipped within 1-2 business days.
                            </p>
                        </div>
                    </>
                );

            case 'failed':
                return (
                    <>
                        <div style={iconStyle}>❌</div>
                        <h1 style={titleStyle}>Payment Verification Failed</h1>
                        <p style={messageStyle}>
                            We couldn't verify your payment. Please contact our support team.
                        </p>

                        <div style={detailsStyle}>
                            <h3 style={{ marginBottom: '20px', color: '#1a1a1a' }}>
                                📋 Order Information
                            </h3>
                            {paymentStatus.orderId && (
                                <p style={{ marginBottom: '10px' }}>
                                    <strong>Order ID:</strong> {paymentStatus.orderId}
                                </p>
                            )}
                            <p style={{ color: '#dc2626' }}>
                                Please keep this order ID for reference when contacting support.
                            </p>
                        </div>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                {renderContent()}

                {/* Navigation */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Link href="/" style={buttonStyle}>
                        🏠 Return to Home
                    </Link>
                    {paymentStatus.status === 'success' && (
                        <Link href="/checkout?productId=3&quantity=1" style={{ ...buttonStyle, backgroundColor: '#3b82f6' }}>
                            🛒 Order Again
                        </Link>
                    )}
                </div>
            </div>

            <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
