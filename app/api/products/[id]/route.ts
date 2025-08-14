import { NextRequest, NextResponse } from 'next/server';
import { getProductById } from '../../../../lib/products';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    console.log('🔍 Fetching product details for ID:', productId);

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    console.log('✅ Product details fetched successfully:', {
      id: product.id,
      name: product.name,
      price: product.price
    });

    return NextResponse.json({
      success: true,
      product: product
    });

  } catch (error: any) {
    console.error('❌ Error fetching product details:', error);
    return NextResponse.json({
      error: 'Failed to fetch product details',
      message: error.message
    }, { status: 500 });
  }
}
