import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test 1: Check if we can import PayPay SDK
    let paypayImport = 'Not tested';
    try {
      const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
      paypayImport = 'Success';
    } catch (importError) {
      paypayImport = `Import failed: ${importError.message}`;
    }

    // Test 2: Check environment variables
    const envCheck = {
      API_KEY: process.env.API_KEY ? 'Set' : 'Missing',
      API_SECRET: process.env.API_SECRET ? 'Set' : 'Missing',
      MERCHANT_ID: process.env.MERCHANT_ID ? 'Set' : 'Missing'
    };

    // Test 3: Try to configure PayPay
    let configResult = 'Not tested';
    try {
      const PAYPAY = require('@paypayopa/paypayopa-sdk-node');
      PAYPAY.Configure({
        clientId: process.env.API_KEY,
        clientSecret: process.env.API_SECRET,
        merchantId: process.env.MERCHANT_ID,
        productionMode: false
      });
      configResult = 'Success';
    } catch (configError) {
      configResult = `Configuration failed: ${configError.message}`;
    }

    // Test 4: Check if uuid is available
    let uuidTest = 'Not tested';
    try {
      const { v4: uuidv4 } = require('uuid');
      const testId = uuidv4();
      uuidTest = `Success: ${testId}`;
    } catch (uuidError) {
      uuidTest = `UUID failed: ${uuidError.message}`;
    }

    res.status(200).json({
      message: 'PayPay SDK Test Results',
      tests: {
        paypayImport,
        envCheck,
        configResult,
        uuidTest
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test error:', error);
    res.status(500).json({
      error: 'Test failed',
      message: error.message,
      stack: error.stack
    });
  }
}
