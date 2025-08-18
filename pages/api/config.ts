import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Return exactly the same format as server.js
    res.status(200).json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({ error: 'Failed to load configuration' });
  }
}
