import Stripe from 'stripe';
import { loadStripe, type Stripe as StripeClient } from '@stripe/stripe-js';

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
