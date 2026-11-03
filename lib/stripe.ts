import Stripe from 'stripe';
import { loadStripe, type Stripe as StripeClient } from '@stripe/stripe-js';

// This site is a portfolio demo: only Stripe test keys are allowed, so nobody can be charged real money.
// To run it as a real shop later, set NEXT_PUBLIC_DEMO_MODE=false.
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';
if (DEMO_MODE && process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_')) {
  throw new Error('Demo mode: use a Stripe test key (sk_test_...), not a live key.');
}

// ✅ Server-side Stripe instance (do not call in client components)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil', // valid API version for Stripe 18.4.0
});

// ✅ Client-side Stripe instance loader
let stripePromise: Promise<StripeClient | null>;
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};
