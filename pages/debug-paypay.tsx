import { useState } from 'react';

export default function DebugPayPay() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    const testPayPay = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await fetch('/api/create-paypay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: 100,
                    currency: 'JPY',
                    productId: 1,
                    quantity: 1
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            setResult(data);
            console.log('PayPay API Response:', data);
        } catch (err: any) {
            setError(err.message);
            console.error('PayPay API Error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>🐛 PayPay API Debug</h1>

            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={testPayPay}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        marginRight: '10px'
                    }}
                >
                    {loading ? 'Testing...' : 'Test PayPay API'}
                </button>

                <button
                    onClick={async () => {
                        setLoading(true);
                        setError('');
                        setResult(null);

                        try {
                            const response = await fetch('/api/test-paypay-simple');
                            if (!response.ok) {
                                throw new Error(`Simple API Error: ${response.status}`);
                            }
                            const data = await response.json();
                            setResult(data);
                            console.log('Simple API Response:', data);
                        } catch (err: any) {
                            setError(err.message);
                            console.error('Simple API Error:', err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    disabled={loading}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#059669',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px'
                    }}
                >
                    Test Simple API
                </button>
            </div>

            {error && (
                <div style={{
                    padding: '16px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    color: '#dc2626',
                    marginBottom: '20px'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div style={{
                    padding: '16px',
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #0ea5e9',
                    borderRadius: '6px',
                    marginBottom: '20px'
                }}>
                    <h3>API Response:</h3>
                    <pre style={{
                        backgroundColor: 'white',
                        padding: '12px',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(result, null, 2)}
                    </pre>

                    {result.redirectUrl && (
                        <div style={{ marginTop: '16px' }}>
                            <p><strong>Redirect URL:</strong></p>
                            <a
                                href={result.redirectUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    backgroundColor: '#059669',
                                    color: 'white',
                                    textDecoration: 'none',
                                    borderRadius: '4px',
                                    marginTop: '8px'
                                }}
                            >
                                🔗 Test PayPay Redirect
                            </a>
                        </div>
                    )}
                </div>
            )}

            <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                marginTop: '20px'
            }}>
                <h3>Environment Check:</h3>
                <ul>
                    <li><strong>API_KEY:</strong> {process.env.NODE_ENV === 'development' ? 'Set' : 'Not visible in production'}</li>
                    <li><strong>API_SECRET:</strong> {process.env.NODE_ENV === 'development' ? 'Set' : 'Not visible in production'}</li>
                    <li><strong>MERCHANT_ID:</strong> {process.env.NODE_ENV === 'development' ? 'Set' : 'Not visible in production'}</li>
                </ul>
            </div>

            <div style={{ marginTop: '20px' }}>
                <a href="/checkout?" style={{
                    padding: '8px 16px',
                    backgroundColor: '#666',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px'
                }}>
                    ← Back to Checkout
                </a>
            </div>
        </div>
    );
}
