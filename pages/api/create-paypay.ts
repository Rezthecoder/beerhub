import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

// Configure PayPay SDK - using the same env var names as server.js
let PAYPAY: any;
try {
  PAYPAY = require('@paypayopa/paypayopa-sdk-node');
  console.log('PayPay SDK imported successfully');
} catch (importError) {
  console.error('Failed to import PayPay SDK:', importError);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== PayPay API Handler Started ===');
    
    const { amount = 100, currency = 'JPY', productId, quantity } = req.body;

    console.log('Request body:', { amount, currency, productId, quantity });
    console.log('Environment variables:', {
      API_KEY: process.env.API_KEY ? 'Set' : 'Missing',
      API_SECRET: process.env.API_SECRET ? 'Set' : 'Missing',
      MERCHANT_ID: process.env.MERCHANT_ID ? 'Set' : 'Missing'
    });

    if (!PAYPAY) {
      throw new Error('PayPay SDK not available');
    }

    // Configure PayPay
    try {
      PAYPAY.Configure({
        clientId: process.env.API_KEY,
        clientSecret: process.env.API_SECRET,
        merchantId: process.env.MERCHANT_ID,
        productionMode: false
      });
      console.log('PayPay configured successfully');
    } catch (configError: any) {
      console.error('PayPay configuration failed:', configError);
      throw new Error(`PayPay configuration failed: ${configError.message}`);
    }

    const paymentId = uuidv4();
    const payload = {
      merchantPaymentId: paymentId,
      amount: { "amount": amount, "currency": currency },
      codeType: 'ORDER_QR',
      orderItems: null,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/callback?merchantPaymentId=${paymentId}&amount=${amount}&productId=${productId}&quantity=${quantity}`,
      redirectType: 'WEB_LINK',
    };

    console.log('Creating PayPay payment with payload:', payload);

    // Wrap PayPay callback in a Promise for proper async handling
    const createPayPayPayment = () => {
      return new Promise((resolve, reject) => {
        console.log('Calling PayPay.QRCodeCreate...');
        
        PAYPAY.QRCodeCreate(payload, (ppResponse: any) => {
          console.log('PayPay response received:', ppResponse);
          
          if (ppResponse && ppResponse.BODY) {
            const body = ppResponse.BODY;
            console.log('PayPay response body:', body);
            
            if (body && body.data && body.data.url) {
              console.log('PayPay payment created successfully:', body);
              resolve({
                redirectUrl: body.data.url,
                paymentId: paymentId
              });
            } else {
              console.error('PayPay payment creation failed:', body);
              reject(new Error(body?.resultInfo?.message || 'PayPay payment creation failed'));
            }
          } else {
            console.error('Invalid PayPay response:', ppResponse);
            reject(new Error('Invalid response from PayPay'));
          }
        });
      });
    };

    console.log('Waiting for PayPay response...');
    
    // Wait for PayPay response
    const result = await createPayPayPayment();
    
    console.log('PayPay payment created successfully:', result);
    
    // Return the redirect URL for the client to handle
    res.status(200).json(result);

  } catch (error: any) {
    console.error('=== PayPay API Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error object:', error);
    
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      details: error.stack
    });
  }
}
