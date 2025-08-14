import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

export default function PaymentCallback() {
    const router = useRouter();
    const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'timeout'>('processing');
    const [message, setMessage] = useState('Verifying your PayPay payment...');

    // Polling function to check payment status
    const pollPaymentStatus = async (merchantPaymentId: string) => {
        const maxAttempts = 10; // number of polls before timeout
        let attempt = 0;

        while (attempt < maxAttempts) {
            try {
                const res = await fetch(`/api/get-payment-status?merchantPaymentId=${merchantPaymentId}`);
                const data = await res.json();
                console.log(`Attempt ${attempt + 1}:`, data);

                if (data.status === 'COMPLETED') {
                    setStatus('success');
                    setMessage('Payment verified! Redirecting...');
                    setTimeout(() => {
                        router.push(`/payment/success?orderId=${router.query.orderId}`);
                    }, 2000);
                    return;
                }

                if (['FAILED', 'CANCELED'].includes(data.status)) {
                    setStatus('failed');
                    setMessage('Payment failed or canceled. Redirecting...');
                    setTimeout(() => {
                        router.push(`/payment/failed?orderId=${router.query.orderId}`);
                    }, 2000);
                    return;
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
            }

            attempt++;
            await new Promise((r) => setTimeout(r, 3000)); // wait 3 seconds before retry
        }

        // Timeout after max attempts
        setStatus('timeout');
        setMessage('Payment verification timed out. Please check later.');
        setTimeout(() => {
            router.push(`/payment/failed?orderId=${router.query.orderId}&reason=timeout`);
        }, 3000);
    };

    useEffect(() => {
        if (router.query.merchantPaymentId) {
            pollPaymentStatus(router.query.merchantPaymentId as string);
        }
    }, [router.query.merchantPaymentId]);

    return (
        <Layout title="Processing Payment - Food & Beer Shop">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 text-center">
                        <div className="card shadow">
                            <div className="card-body py-5">
                                <div className="mb-4">
                                    {status === 'processing' && (
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                    {status === 'success' && (
                                        <div className="text-success" style={{ fontSize: '4rem' }}>✓</div>
                                    )}
                                    {status === 'failed' && (
                                        <div className="text-danger" style={{ fontSize: '4rem' }}>✗</div>
                                    )}
                                    {status === 'timeout' && (
                                        <div className="text-warning" style={{ fontSize: '4rem' }}>⏳</div>
                                    )}
                                </div>

                                <h3 className="mb-3">
                                    {status === 'processing' && 'Processing Payment...'}
                                    {status === 'success' && 'Payment Verified!'}
                                    {status === 'failed' && 'Payment Failed'}
                                    {status === 'timeout' && 'Verification Timeout'}
                                </h3>
                                <p className="text-muted">{message}</p>

                                {status === 'failed' && (
                                    <div className="alert alert-danger mt-3">
                                        <small>Redirecting to error page...</small>
                                    </div>
                                )}
                                {status === 'success' && (
                                    <div className="alert alert-success mt-3">
                                        <small>Redirecting to success page...</small>
                                    </div>
                                )}
                                {status === 'timeout' && (
                                    <div className="alert alert-warning mt-3">
                                        <small>Please contact support if payment was deducted.</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
