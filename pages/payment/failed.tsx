import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

export default function PaymentFailed() {
    const router = useRouter();
    const [orderId, setOrderId] = useState<string>('');
    const [reason, setReason] = useState<string>('');

    useEffect(() => {
        if (router.query.orderId) {
            setOrderId(router.query.orderId as string);
        }
        if (router.query.reason) {
            setReason(router.query.reason as string);
        }
    }, [router.query]);

    const getReasonMessage = (reason: string) => {
        switch (reason) {
            case 'CANCELED':
                return 'Payment was canceled by the customer';
            case 'FAILED':
                return 'An error occurred during payment processing';
            case 'EXPIRED':
                return 'Payment session has expired';
            default:
                return 'A problem occurred during payment processing';
        }
    };

    return (
        <Layout title="Payment Failed - Food & Beer Shop">
            <div className="container py-5">
                <div className="row justify-content-center">
                    <div className="col-md-6 text-center">
                        <div className="card shadow">
                            <div className="card-body py-5">
                                <div className="mb-4">
                                    <div className="text-danger" style={{ fontSize: '4rem' }}>
                                        ✗
                                    </div>
                                </div>
                                <h2 className="text-danger mb-3">Payment Failed</h2>
                                <p className="text-muted mb-4">
                                    {reason ? getReasonMessage(reason) : 'A problem occurred during payment processing.'}
                                    <br />
                                    Please try again or use a different payment method.
                                </p>
                                {orderId && (
                                    <p className="small text-muted mb-4">
                                        Order ID: {orderId}
                                    </p>
                                )}
                                <div className="d-grid gap-2">
                                    <button
                                        onClick={() => router.back()}
                                        className="btn btn-primary"
                                    >
                                        Go Back & Retry
                                    </button>
                                    <button
                                        onClick={() => router.push('/')}
                                        className="btn btn-outline-secondary"
                                    >
                                        Back to Home
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}