import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface PaymentDetails {
    productName: string;
    quantity: number;
    total: number;
    paymentMethod: string;
    transactionId?: string;
}

export default function PaymentSuccessPage() {
    const router = useRouter();
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Get payment details from URL parameters
        const { productName, quantity, total, method, paymentId } = router.query;

        if (productName && quantity && total) {
            setPaymentDetails({
                productName: productName as string,
                quantity: parseInt(quantity as string),
                total: parseInt(total as string),
                paymentMethod: method === 'paypay' ? 'PayPay' : 'Credit Card',
                transactionId: paymentId as string
            });
        }

        // Auto-redirect countdown
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    router.push('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

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

    const successCardStyle = {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: 'clamp(30px, 6vw, 50px)',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        border: '2px solid #10b981',
        textAlign: 'center' as const,
        width: '100%'
    };

    const successIconStyle = {
        fontSize: 'clamp(60px, 12vw, 80px)',
        marginBottom: '20px',
        animation: 'bounce 1s ease-in-out'
    };

    const titleStyle = {
        fontSize: 'clamp(28px, 6vw, 36px)',
        marginBottom: '15px',
        color: '#10b981',
        fontWeight: 'bold'
    };

    const subtitleStyle = {
        fontSize: 'clamp(16px, 3vw, 18px)',
        color: '#666',
        marginBottom: '30px'
    };

    const detailsCardStyle = {
        backgroundColor: '#f8fafc',
        borderRadius: '12px',
        padding: 'clamp(20px, 4vw, 30px)',
        marginBottom: '30px',
        width: '100%'
    };

    const detailRowStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: '1px solid #e2e8f0',
        fontSize: 'clamp(14px, 3vw, 16px)'
    };

    const detailLabelStyle = {
        color: '#64748b',
        fontWeight: '500'
    };

    const detailValueStyle = {
        color: '#1e293b',
        fontWeight: '600'
    };

    const totalStyle = {
        fontSize: 'clamp(20px, 4vw, 24px)',
        fontWeight: 'bold',
        color: '#10b981',
        padding: '15px',
        backgroundColor: '#ecfdf5',
        borderRadius: '8px',
        border: '2px solid #10b981',
        marginTop: '15px'
    };

    const navigationStyle = {
        display: 'flex',
        gap: 'clamp(15px, 3vw, 25px)',
        justifyContent: 'center',
        flexWrap: 'wrap' as const,
        width: '100%'
    };

    const buttonStyle = (variant: 'primary' | 'secondary') => ({
        padding: 'clamp(12px, 3vw, 16px) 24px',
        backgroundColor: variant === 'primary' ? '#10b981' : '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: 'clamp(14px, 3vw, 16px)',
        fontWeight: '600',
        cursor: 'pointer',
        textDecoration: 'none',
        display: 'inline-block',
        transition: 'all 0.2s ease'
    });

    const countdownStyle = {
        fontSize: 'clamp(14px, 3vw, 16px)',
        color: '#64748b',
        marginTop: '20px'
    };

    if (!paymentDetails) {
        return (
            <div style={containerStyle}>
                <div style={successCardStyle}>
                    <div style={successIconStyle}>⏳</div>
                    <h1 style={titleStyle}>Loading...</h1>
                    <p style={subtitleStyle}>Please wait while we load your payment details.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={containerStyle}>
            <div style={successCardStyle}>
                {/* Success Icon */}
                <div style={successIconStyle}>🎉</div>

                {/* Success Title */}
                <h1 style={titleStyle}>Payment Successful!</h1>
                <p style={subtitleStyle}>
                    Thank you for your order! Your payment has been processed successfully.
                </p>

                {/* Payment Details */}
                <div style={detailsCardStyle}>
                    <h3 style={{ marginBottom: '20px', color: '#1e293b', fontSize: 'clamp(18px, 4vw, 20px)' }}>
                        📋 Order Details
                    </h3>

                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Product:</span>
                        <span style={detailValueStyle}>{paymentDetails.productName}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Quantity:</span>
                        <span style={detailValueStyle}>{paymentDetails.quantity}</span>
                    </div>

                    <div style={detailRowStyle}>
                        <span style={detailLabelStyle}>Payment Method:</span>
                        <span style={detailValueStyle}>{paymentDetails.paymentMethod}</span>
                    </div>

                    {paymentDetails.transactionId && (
                        <div style={detailRowStyle}>
                            <span style={detailLabelStyle}>Transaction ID:</span>
                            <span style={detailValueStyle}>{paymentDetails.transactionId}</span>
                        </div>
                    )}

                    <div style={totalStyle}>
                        Total: ¥{paymentDetails.total.toLocaleString()}
                    </div>
                </div>

                {/* Next Steps */}
                <div style={{ marginBottom: '30px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#1e293b' }}>🚚 What's Next?</h4>
                    <p style={{ color: '#64748b', fontSize: 'clamp(14px, 3vw, 16px)' }}>
                        You will receive a confirmation email shortly.
                        Your order will be processed and shipped within 1-2 business days.
                    </p>
                </div>

                {/* Navigation */}
                <div style={navigationStyle}>
                    <Link href="/" style={buttonStyle('primary')}>
                        🏠 Return to Home
                    </Link>
                    <Link href="/checkout?productId=3&quantity=1" style={buttonStyle('secondary')}>
                        🛒 Order Again
                    </Link>
                </div>

                {/* Auto-redirect countdown */}
                <div style={countdownStyle}>
                    Auto-redirecting to home in {countdown} seconds...
                </div>
            </div>

            <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
        </div>
    );
}
