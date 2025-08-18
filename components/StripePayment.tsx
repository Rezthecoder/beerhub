import { useEffect, useState } from 'react';

interface StripePaymentProps {
    amount: number;
    productId: number;
    quantity: number;
    productName: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export default function StripePayment({
    amount,
    productId,
    quantity,
    productName,
    onSuccess,
    onError
}: StripePaymentProps) {
    const [loading, setLoading] = useState(false);
    const [stripeLoaded, setStripeLoaded] = useState(false);
    const [error, setError] = useState<string>('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

    // Initialize Stripe when component mounts
    useEffect(() => {
        const initializeStripe = async () => {
            try {
                console.log('StripePayment: Initializing Stripe...');

                // Wait for Stripe to be available
                let attempts = 0;
                const maxAttempts = 10;

                while (!(window as any).Stripe && attempts < maxAttempts) {
                    console.log(`StripePayment: Waiting for Stripe to load... attempt ${attempts + 1}`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    attempts++;
                }

                if (!(window as any).Stripe) {
                    // Fallback: Try to load Stripe script dynamically
                    console.log('StripePayment: Stripe not found, trying to load dynamically...');
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://js.stripe.com/v3/';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.head.appendChild(script);
                    });

                    // Wait a bit more for the script to initialize
                    await new Promise(resolve => setTimeout(resolve, 200));

                    if (!(window as any).Stripe) {
                        throw new Error('Failed to load Stripe script dynamically');
                    }
                }

                console.log('StripePayment: Stripe library loaded successfully');
                setStripeLoaded(true);

                // Get publishable key
                console.log('StripePayment: Fetching publishable key...');
                const response = await fetch('/api/config');

                if (!response.ok) {
                    throw new Error(`Config API returned ${response.status}`);
                }

                const { publishableKey } = await response.json();

                if (!publishableKey) {
                    throw new Error('No publishable key returned from the server');
                }

                // Initialize Stripe
                const stripe = (window as any).Stripe(publishableKey);
                console.log('StripePayment: Stripe instance created');

                // Create payment intent
                console.log('StripePayment: Creating payment intent...');
                const paymentIntentResponse = await fetch('/api/create-payment-intent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items: [{
                            id: productId,
                            name: productName,
                            price: amount,
                            quantity: quantity
                        }],
                        amount: amount,
                        currency: 'JPY',
                        productId: productId,
                        quantity: quantity
                    }),
                });

                if (!paymentIntentResponse.ok) {
                    const errorText = await paymentIntentResponse.text();
                    throw new Error(`Payment intent API returned ${paymentIntentResponse.status}: ${errorText}`);
                }

                const { clientSecret } = await paymentIntentResponse.json();

                if (!clientSecret) {
                    throw new Error('No client secret returned');
                }

                // Create Stripe Elements
                const elements = stripe.elements({
                    appearance: { theme: 'stripe' },
                    clientSecret,
                    externalPaymentMethodTypes: ['external_paypay']
                });

                // Create and mount payment element
                const paymentElement = elements.create('payment', {
                    paymentMethodOrder: ['card', 'external_paypay']
                });

                const paymentElementContainer = document.getElementById('stripe-payment-element');
                if (paymentElementContainer) {
                    paymentElement.mount('#stripe-payment-element');
                    console.log('StripePayment: Stripe Elements mounted successfully');

                    // Listen for payment method changes
                    paymentElement.on('change', (event: any) => {
                        console.log('StripePayment: Payment method changed:', event);
                        if (event.value) {
                            setSelectedPaymentMethod(event.value.type);
                            console.log('StripePayment: Selected payment method:', event.value.type);
                        }
                    });

                    // Store stripe and elements for form submission
                    (window as any).stripe = stripe;
                    (window as any).elements = elements;
                } else {
                    console.error('StripePayment: Payment element container not found');
                }

            } catch (error: any) {
                console.error('StripePayment: Stripe initialization failed:', error);
                setError('Failed to initialize payment form: ' + error.message);
                onError?.(error.message);
            }
        };

        initializeStripe();
    }, [amount, productId, quantity, productName, onError]);

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            console.log('StripePayment: Button clicked, processing payment...');
            console.log('StripePayment: Selected payment method:', selectedPaymentMethod);

            const stripe = (window as any).stripe;
            const elements = (window as any).elements;

            if (!stripe || !elements) {
                throw new Error('Stripe not initialized');
            }

            if (!selectedPaymentMethod) {
                throw new Error('Please select a payment method first');
            }

            if (selectedPaymentMethod === 'external_paypay') {
                // Handle PayPay through Stripe
                console.log('StripePayment: PayPay selected through Stripe');
                // Redirect to PayPay API
                const paypayResponse = await fetch('/api/create-paypay', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        amount: amount,
                        currency: 'JPY',
                        productId: productId,
                        quantity: quantity
                    }),
                });

                if (!paypayResponse.ok) {
                    throw new Error('Failed to create PayPay payment');
                }

                const { redirectUrl } = await paypayResponse.json();

                if (redirectUrl) {
                    console.log('StripePayment: Redirecting to PayPay:', redirectUrl);
                    // Redirect to PayPay immediately
                    window.location.href = redirectUrl;
                } else {
                    throw new Error('No PayPay redirect URL received');
                }
            } else if (selectedPaymentMethod === 'card') {
                // Handle card payment
                console.log('StripePayment: Card payment selected, confirming payment...');
                const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: `${window.location.origin}/payment-success?productName=${encodeURIComponent(productName)}&quantity=${quantity}&total=${amount}&method=card&paymentId=${Date.now()}`,
                    },
                });

                if (error) {
                    if (error.type === "card_error" || error.type === "validation_error") {
                        throw new Error(error.message);
                    } else {
                        throw new Error("An unexpected error occurred.");
                    }
                } else {
                    console.log('StripePayment: Payment confirmation successful - redirecting...');
                    // Stripe will handle the redirect automatically
                    // No need to call onSuccess here
                }
            } else {
                throw new Error('Unsupported payment method selected');
            }
        } catch (error: any) {
            console.error('StripePayment: Payment submission error:', error);
            const errorMessage = error.message || 'Unknown error occurred';
            setError(errorMessage);
            onError?.(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div style={{
                padding: '20px',
                backgroundColor: '#fee2e2',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                color: '#dc2626',
                marginBottom: '20px'
            }}>
                <strong>Payment Error:</strong> {error}
                <button
                    onClick={() => setError('')}
                    style={{
                        marginLeft: '10px',
                        padding: '4px 8px',
                        backgroundColor: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (!stripeLoaded) {
        return (
            <div style={{
                padding: '20px',
                textAlign: 'center',
                color: '#666'
            }}>
                Loading payment form...
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            <div id="stripe-payment-element"></div>
            <button
                onClick={handleSubmit}
                disabled={loading || !selectedPaymentMethod}
                style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: loading || !selectedPaymentMethod ? '#9ca3af' : '#0066cc',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: loading || !selectedPaymentMethod ? 'not-allowed' : 'pointer',
                    marginTop: '20px'
                }}
            >
                {loading ? 'Processing...' :
                    !selectedPaymentMethod ? 'Select Payment Method' :
                        `Pay ¥${amount.toLocaleString()}`}
            </button>

            {!selectedPaymentMethod && (
                <p style={{
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '14px',
                    marginTop: '10px'
                }}>
                    Please select a payment method above
                </p>
            )}
        </div>
    );
}
