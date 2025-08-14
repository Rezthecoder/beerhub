# Stripe Setup Guide

## 1. Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up for a free account
3. Complete account verification

## 2. Get API Keys
1. Go to Stripe Dashboard
2. Click "Developers" → "API keys"
3. Copy your test keys:
   - Publishable key (pk_test_...)
   - Secret key (sk_test_...)

## 3. Set up Webhooks
1. Go to "Developers" → "Webhooks"
2. Click "Add endpoint"
3. Endpoint URL: `http://localhost:3000/api/stripe-webhook` (for local testing)
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
5. Copy the webhook secret (whsec_...)

## 4. Update .env File
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## 5. Test Locally with Stripe CLI (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

## 6. Test Credit Cards
Use these test card numbers:
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **3D Secure:** 4000 0025 0000 3155

Any future expiry date and any 3-digit CVC will work.

## 7. Production Setup
For production:
1. Use live API keys (pk_live_... and sk_live_...)
2. Set webhook URL to your production domain
3. Enable live mode in Stripe dashboard