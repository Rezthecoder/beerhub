import type { NextApiRequest, NextApiResponse } from 'next';
import { payPayService } from '../../lib/paypay';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = payPayService.getWebhookConfiguration();
    
    res.status(200).json({
      success: true,
      message: 'PayPay Webhook Configuration',
      config: config
    });
  } catch (error: any) {
    console.error('Webhook config error:', error);
    res.status(500).json({
      error: 'Failed to get webhook configuration',
      message: error.message
    });
  }
}
