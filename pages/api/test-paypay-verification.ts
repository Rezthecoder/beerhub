import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== PayPay Verification Test ===');

    // Test 1: Check environment variables
    const envCheck = {
      API_KEY: process.env.API_KEY ? 'Set' : 'Missing',
      API_SECRET: process.env.API_SECRET ? 'Set' : 'Missing',
      MERCHANT_ID: process.env.MERCHANT_ID ? 'Set' : 'Missing'
    };

    console.log('Environment variables:', envCheck);

    // Test 2: Try to import PayPay SDK
    let paypayImport = 'Not tested';
    let paypayConfig = 'Not tested';
    
    try {
      const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
      paypayImport = 'Success';
      
      // Test 3: Try to configure PayPay
      try {
        PAYPAY.Configure({
          clientId: process.env.API_KEY,
          clientSecret: process.env.API_SECRET,
          merchantId: process.env.MERCHANT_ID,
          productionMode: false
        });
        paypayConfig = 'Success';
      } catch (configError: any) {
        paypayConfig = `Configuration failed: ${configError.message}`;
      }
      
    } catch (importError: any) {
      paypayImport = `Import failed: ${importError.message}`;
    }

    // Test 4: Check if we can make a simple API call
    let apiTest = 'Not tested';
    try {
      const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
      PAYPAY.Configure({
        clientId: process.env.API_KEY,
        clientSecret: process.env.API_SECRET,
        merchantId: process.env.MERCHANT_ID,
        productionMode: false
      });
      
      // This is just a test - we won't actually call the API
      apiTest = 'SDK ready for API calls';
    } catch (apiError: any) {
      apiTest = `API test failed: ${apiError.message}`;
    }

    const results = {
      message: 'PayPay Verification Test Results',
      timestamp: new Date().toISOString(),
      tests: {
        environmentVariables: envCheck,
        paypayImport,
        paypayConfig,
        apiTest
      }
    };

    console.log('Test results:', results);
    res.status(200).json(results);

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
