document.addEventListener("DOMContentLoaded", async () => {
    // Get product data from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('productId');
    const quantity = parseInt(urlParams.get('quantity') || '1');
    const paymentMethod = urlParams.get('method');

    // Get checkout data from the page (set by React component)
    const checkoutData = window.checkoutData || {};
    const total = checkoutData.total || 1400; // fallback to default amount

    console.log('Checkout data:', { productId, quantity, total, paymentMethod });

    const { publishableKey } = await fetch('/api/config').then((r) => r.json());
    if (!publishableKey) {
        addMessage(
            'No publishable key returned from the server. Please check `.env` and try again'
        );
        alert('Please set your Stripe publishable API key in the .env file');
    }

    // This is a public sample test API key.
    // Don't submit any personally identifiable information in requests made with this key.
    // Sign in to see your own test API key embedded in code samples.
    const stripe = Stripe(publishableKey);

    // The items the customer wants to buy - now dynamic
    const items = [{
        id: productId || "default",
        quantity: quantity,
        amount: total
    }];

    let elements;
    let selectedPaymentMethod = null; // Initialize the variable

    // Initialize based on payment method
    if (paymentMethod === 'paypay') {
        console.log('=== Payment method is paypay, initializing PayPay ===');
        // For PayPay, show QR code section
        initializePayPayQR();
    } else {
        console.log('=== Payment method is not paypay, initializing Stripe ===');
        // For credit card, initialize Stripe
        initialize();
    }

    checkStatus();

    document
        .querySelector("#payment-form")
        .addEventListener("submit", handleSubmit);

    // Initialize PayPay QR code functionality
    function initializePayPayQR() {
        console.log('=== initializePayPayQR called ===');

        const tryInitialize = () => {
            const generateButton = document.getElementById('generate-paypay-qr');
            console.log('Looking for PayPay button:', generateButton);
            console.log('Button element details:', {
                id: generateButton?.id,
                textContent: generateButton?.textContent,
                disabled: generateButton?.disabled,
                onclick: generateButton?.onclick
            });

            if (generateButton) {
                console.log('PayPay button found, adding click listener');
                generateButton.addEventListener('click', (e) => {
                    console.log('PayPay button clicked!', e);
                    generatePayPayQR();
                });
                console.log('Click listener added successfully');
                return true;
            } else {
                console.error('PayPay button not found!');
                // Try to find it by other means
                const allButtons = document.querySelectorAll('button');
                console.log('All buttons on page:', Array.from(allButtons).map(b => ({ id: b.id, text: b.textContent })));
                return false;
            }
        };

        // Try immediately
        if (!tryInitialize()) {
            // If not found, try again after a short delay
            console.log('Button not found, retrying in 100ms...');
            setTimeout(() => {
                if (!tryInitialize()) {
                    console.log('Button still not found, retrying in 500ms...');
                    setTimeout(() => {
                        if (!tryInitialize()) {
                            console.error('Failed to find PayPay button after multiple attempts');
                        }
                    }, 500);
                }
            }, 100);
        }
    }

    // Generate PayPay payment and redirect
    async function generatePayPayQR() {
        const generateButton = document.getElementById('generate-paypay-qr');

        if (generateButton) {
            generateButton.disabled = true;
            generateButton.textContent = 'Processing...';

            try {
                // Create PayPay payment
                const response = await fetch("/api/create-paypay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: total,
                        currency: 'JPY',
                        productId: productId,
                        quantity: quantity
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create PayPay payment');
                }

                const { redirectUrl } = await response.json();

                if (redirectUrl) {
                    // Redirect directly to PayPay payment page
                    showMessage('Redirecting to PayPay...');
                    console.log('Redirecting to PayPay:', redirectUrl);

                    // Small delay to show the message, then redirect
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    throw new Error('No PayPay redirect URL received');
                }
            } catch (error) {
                console.error('PayPay payment error:', error);
                showMessage('Failed to create PayPay payment: ' + error.message);

                // Reset button
                generateButton.disabled = false;
                generateButton.textContent = 'Pay with PayPay';
            }
        }
    }

    // Fetches a payment intent and captures the client secret
    async function initialize() {
        try {
            const response = await fetch("/api/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    amount: total // Pass the dynamic amount
                }),
            });
            const { clientSecret } = await response.json();

            const appearance = {
                theme: 'stripe',
            };
            elements = stripe.elements({
                appearance,
                clientSecret,
                externalPaymentMethodTypes: ['external_paypay']
            });

            const paymentElement = elements.create("payment", {
                paymentMethodOrder: ['card', 'external_paypay']
            });
            paymentElement.mount("#payment-element");

            // Track selected payment method
            paymentElement.on('change', (event) => {
                selectedPaymentMethod = event?.value?.type;
                updateButtonText();
                console.log('Selected payment method:', selectedPaymentMethod);
            });

            // Set initial button text
            updateButtonText();
        } catch (error) {
            console.error('Failed to initialize payment:', error);
            showMessage('Failed to initialize payment. Please refresh the page.');
        }
    }

    function updateButtonText() {
        const buttonText = document.querySelector("#button-text");
        if (selectedPaymentMethod === 'external_paypay') {
            buttonText.textContent = `Pay ¥${total.toLocaleString()} with PayPay`;
        } else if (selectedPaymentMethod === 'card') {
            buttonText.textContent = `Pay ¥${total.toLocaleString()} with Card`;
        } else {
            buttonText.textContent = `Pay ¥${total.toLocaleString()}`;
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();

        if (!selectedPaymentMethod) {
            showMessage('Please select a payment method first.');
            return;
        }

        setLoading(true);

        try {
            if (selectedPaymentMethod === 'external_paypay') {
                // Handle PayPay payment
                showMessage('Creating PayPay payment...');

                const response = await fetch("/api/create-paypay", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: total,
                        currency: 'JPY',
                        productId: productId,
                        quantity: quantity
                    }),
                });

                if (!response.ok) {
                    throw new Error('Failed to create PayPay payment');
                }

                const { redirectUrl } = await response.json();

                if (redirectUrl) {
                    showMessage('Redirecting to PayPay...');
                    console.log('Redirecting to PayPay:', redirectUrl);
                    // Small delay to show the message
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    throw new Error('No PayPay redirect URL received');
                }

                // Don't call setLoading(false) here as we're redirecting
                return;
            } else {
                // Handle Stripe card payment
                showMessage('Processing card payment...');

                const { error } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        // Make sure to change this to your payment completion page
                        return_url: `${window.location.origin}/checkout?productId=${productId}&quantity=${quantity}`,
                    },
                });

                // This point will only be reached if there is an immediate error when
                // confirming the payment. Otherwise, your customer will be redirected to
                // your `return_url`. For some payment methods like iDEAL, your customer will
                // be redirected to an intermediate site first to authorize the payment, then
                // redirected to the `return_url`.
                if (error) {
                    if (error.type === "card_error" || error.type === "validation_error") {
                        showMessage(error.message);
                    } else {
                        showMessage("An unexpected error occurred.");
                    }
                }
            }
        } catch (err) {
            console.error('Payment error:', err);
            showMessage(err.message || "An unexpected error occurred.");
        } finally {
            if (selectedPaymentMethod !== 'external_paypay') {
                setLoading(false);
            }
        }
    }

    // Fetches the payment intent status after payment submission
    async function checkStatus() {
        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) {
            return;
        }

        try {
            const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

            switch (paymentIntent.status) {
                case "succeeded":
                    showMessage("Payment succeeded! 🎉");
                    break;
                case "processing":
                    showMessage("Your payment is processing. Please wait...");
                    break;
                case "requires_payment_method":
                    showMessage("Your payment was not successful, please try again.");
                    break;
                default:
                    showMessage("Something went wrong.");
                    break;
            }
        } catch (error) {
            console.error('Failed to check payment status:', error);
            showMessage('Failed to check payment status.');
        }
    }

    // ------- UI helpers -------

    function showMessage(messageText) {
        const messageContainer = document.querySelector("#payment-message");
        const isError = messageText.toLowerCase().includes('error') ||
            messageText.toLowerCase().includes('failed') ||
            messageText.toLowerCase().includes('wrong');

        messageContainer.classList.remove("hidden");
        messageContainer.textContent = messageText;

        // Add error styling for error messages
        if (isError) {
            messageContainer.style.color = 'var(--error)';
            messageContainer.style.background = 'rgba(220, 38, 38, 0.1)';
        } else {
            messageContainer.style.color = 'var(--success)';
            messageContainer.style.background = 'rgba(15, 81, 50, 0.1)';
        }

        // Auto-hide success messages, keep error messages visible longer
        const hideDelay = isError ? 8000 : 4000;
        setTimeout(function () {
            messageContainer.classList.add("hidden");
            messageContainer.textContent = "";
        }, hideDelay);
    }

    // Show a spinner on payment submission
    function setLoading(isLoading) {
        if (isLoading) {
            // Disable the button and show a spinner
            document.querySelector("#submit").disabled = true;
            document.querySelector("#spinner").classList.remove("hidden");
            document.querySelector("#button-text").classList.add("hidden");
        } else {
            document.querySelector("#submit").disabled = false;
            document.querySelector("#spinner").classList.add("hidden");
            document.querySelector("#button-text").classList.remove("hidden");
        }
    }

    function addMessage(messageText) {
        showMessage(messageText);
    }
});
