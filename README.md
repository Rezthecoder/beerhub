# BeerHub (demo)

A demo online shop for Japanese beer, built by RezX Kaihatsu as a portfolio project.
Customers can browse beers, read reviews and check out with Stripe (card), PayPay or cash on delivery,
then download a PDF receipt. Orders are stored in Supabase.

**This is a demo.** Payments run in test mode (Stripe test keys, PayPay sandbox) and nothing is shipped.
A notice at the top of every page says so.

Live demo: https://beerhub.rezkaihatsu.com

## Tech

Next.js 14 (pages router), Supabase, Stripe, PayPay. Same neo-brutalist design as rezkaihatsu.com.

## Run locally

```bash
npm ci
cp .env.example .env.local   # then fill in your test keys
npm run dev
```

## Deploy on Vercel at beerhub.rezkaihatsu.com

1. **Database:** in Supabase, open SQL Editor and run `supabase/lock-down-demo.sql` once.
   This keeps products public but closes orders and payments to the public key.
2. **Project:** in Vercel, Add New → Project → import this repository (framework: Next.js).
3. **Environment variables:** add every variable from `.env.example` with real test values.
   Use Stripe **test** keys; live keys are refused while `NEXT_PUBLIC_DEMO_MODE` is `true`.
4. **Domain:** Project → Settings → Domains → add `beerhub.rezkaihatsu.com`,
   then add the CNAME record Vercel shows you at your DNS provider.
5. **Webhooks:** point them at the new address:
   - Stripe (test mode): `https://beerhub.rezkaihatsu.com/api/stripe-webhook`
   - PayPay sandbox: `https://beerhub.rezkaihatsu.com/api/paypay-webhook`

## PayPay (sandbox)

1. Checkout creates a PayPay payment (`/api/paypay/create`). The price always comes from the catalogue.
2. On a computer the customer scans the QR code with the PayPay sandbox app or opens PayPay's payment page;
   on a phone they go straight to PayPay.
3. The site asks PayPay for the result every few seconds (`/api/paypay/status`), and PayPay also sends the
   customer back to `/payment/callback`. A payment only counts as paid when PayPay's API says `COMPLETED`.
4. `/api/paypay-webhook` (optional, set it in the PayPay developer dashboard) re-checks with PayPay too,
   so a forged webhook can't mark an order paid.

To pay in the sandbox you need a **PayPay sandbox test user**: PayPay for Developers → your sandbox app →
test users. The order database is optional for PayPay: if Supabase is down the payment still works and
the receipt is built from PayPay's record.

## Admin

`/admin/orders` lists recent orders. The browser asks for a username and password,
which are `ADMIN_USER` (default `admin`) and `ADMIN_PASSWORD`. If `ADMIN_PASSWORD`
is not set, the admin page stays locked.
