import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const productId = parseInt(id as string);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    console.log('Fetching product from Supabase:', productId);

    // Fetch product from Supabase
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error', 
        message: error.message 
      });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    console.log('Product found:', product);

    // Return product data
    res.status(200).json(product);

  } catch (error: any) {
    console.error('Product API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
