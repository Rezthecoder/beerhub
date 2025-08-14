import { NextRequest, NextResponse } from 'next/server';
import { getOrderWithPayments } from '../../../lib/products';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId parameter' }, { status: 400 });
  }

  try {
    console.log('🔍 Fetching order details for Order ID:', orderId);

    // Parse orderId to number
    const orderIdNum = parseInt(orderId as string);
    if (isNaN(orderIdNum)) {
      return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 });
    }

    // Fetch order details from database
    const orderDetails = await getOrderWithPayments(orderIdNum);

    if (!orderDetails) {
      console.log('❌ Order not found:', orderId);
      return NextResponse.json({ 
        error: 'Order not found',
        orderId: orderId 
      }, { status: 404 });
    }

    console.log('✅ Order details fetched successfully:', {
      orderId: orderDetails.id,
      productName: orderDetails.products?.name,
      paymentStatus: orderDetails.payment_status,
      paymentMethod: orderDetails.payment_method
    });

    // Return order details
    return NextResponse.json({
      success: true,
      order: orderDetails
    });

  } catch (error: any) {
    console.error('❌ Error fetching order details:', error);
    return NextResponse.json({
      error: 'Failed to fetch order details',
      message: error.message,
      orderId: orderId
    }, { status: 500 });
  }
}
