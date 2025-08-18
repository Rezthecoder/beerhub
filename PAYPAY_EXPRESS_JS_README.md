# PayPay Integration with Express.js Logic

This project implements PayPay payments in Next.js using the same logic structure as your Express.js application.

## 🚀 **Quick Start**

### 1. **Install Dependencies**
```bash
npm install @paypayopa/paypayopa-sdk-node uuid
npm install --save-dev @types/uuid
```

### 2. **Set Environment Variables**
Create a `.env.local` file:
```bash
# PayPay Configuration
PAYPAY_API_KEY=your_paypay_api_key_here
PAYPAY_SECRET=your_paypay_secret_here
PAYPAY_MERCHANT_ID=your_paypay_merchant_id_here

# Stripe Configuration (for unified checkout)
STRIPE_SECRET_KEY=your_stripe_secret_key_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. **Test the Integration**
Visit `/test-paypay` to test both PayPay-only and unified checkout.

## 🔧 **API Endpoints**

### **PayPay Payment Creation** (`/api/create-paypay`)
```typescript
POST /api/create-paypay
{
  "amount": 1000,
  "currency": "JPY",
  "redirectUrl": "http://localhost:3000/payment/callback"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://paypay.ne.jp/payment/...",
  "paymentId": "uuid-here",
  "data": { ... }
}
```

### **Stripe Payment Intent** (`/api/create-payment-intent`)
```typescript
POST /api/create-payment-intent
{
  "items": [{ "id": "default", "amount": 1000 }],
  "amount": 1000
}
```

**Response:**
```json
{
  "clientSecret": "pi_..._secret_..."
}
```

### **Configuration** (`/api/config`)
```typescript
GET /api/config
```

**Response:**
```json
{
  "paypayEnabled": true,
  "paypayConfig": {
    "clientId": "your_api_key",
    "clientSecret": true,
    "merchantId": true,
    "productionMode": false
  },
  "baseUrl": "http://localhost:3000",
  "environment": "development"
}
```

## 📱 **Components**

### **PayPayCheckout**
Simple PayPay-only checkout component:
```typescript
<PayPayCheckout
  amount={1000}
  currency="JPY"
  onSuccess={(paymentId) => console.log('Success:', paymentId)}
  onError={(error) => console.error('Error:', error)}
/>
```

### **UnifiedPaymentCheckout**
Combined Stripe + PayPay checkout:
```typescript
<UnifiedPaymentCheckout
  amount={1000}
  currency="JPY"
  onSuccess={(paymentId, method) => console.log(`${method}:`, paymentId)}
  onError={(error) => console.error('Error:', error)}
/>
```

## 🔄 **Payment Flow**

### **PayPay Flow:**
1. User selects PayPay payment method
2. Component calls `/api/create-paypay`
3. PayPay SDK creates QR code payment
4. Returns payment URL
5. User redirects to PayPay to complete payment

### **Stripe Flow:**
1. User selects Stripe payment method
2. Component calls `/api/create-payment-intent`
3. Stripe creates payment intent
4. Returns client secret
5. Stripe Elements can be rendered with client secret

## 🧪 **Testing**

### **Test Page: `/test-paypay`**
- Test PayPay-only checkout
- Test unified checkout (Stripe + PayPay)
- Adjust payment amounts
- View success/error handling

### **Manual API Testing:**
```bash
# Test PayPay
curl -X POST http://localhost:3000/api/create-paypay \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "currency": "JPY"}'

# Test Stripe
curl -X POST http://localhost:3000/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Test Config
curl http://localhost:3000/api/config
```

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"PayPay is not configured"**
   - Check environment variables
   - Verify `.env.local` file exists
   - Restart development server

2. **"Module not found" errors**
   - Install required dependencies
   - Check import paths

3. **PayPay API errors**
   - Verify API credentials
   - Check sandbox vs production mode
   - Ensure merchant account is active

### **Debug Steps:**
1. Check browser console for errors
2. Verify environment variables in `/api/config`
3. Test API endpoints manually
4. Check PayPay account status

## 📋 **Environment Variables Reference**

| Variable | Description | Required |
|----------|-------------|----------|
| `PAYPAY_API_KEY` | PayPay API key | ✅ |
| `PAYPAY_SECRET` | PayPay API secret | ✅ |
| `PAYPAY_MERCHANT_ID` | PayPay merchant ID | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ❌ (for unified checkout) |
| `NEXT_PUBLIC_BASE_URL` | Your base URL | ❌ (defaults to localhost:3000) |

## 🚀 **Next Steps**

1. **Integrate with your checkout page**
2. **Add payment status tracking**
3. **Implement webhook handling**
4. **Add error recovery mechanisms**
5. **Style components to match your design**

## 📚 **Files Created**

- `pages/api/create-paypay.ts` - PayPay payment creation
- `pages/api/create-payment-intent.ts` - Stripe payment intent
- `pages/api/config.ts` - Configuration endpoint
- `components/PayPayCheckout.tsx` - PayPay-only component
- `components/UnifiedPaymentCheckout.tsx` - Combined component
- `pages/test-paypay.tsx` - Test page
- `styles/globals.css` - Added `.hidden` utility class

The integration follows your Express.js logic exactly and provides a clean, maintainable way to handle both PayPay and Stripe payments in Next.js! 🎯
