import { supabase, getSupabaseAdmin } from './supabase';
import { Database } from './database.types';
import { DEMO_PRODUCTS } from './demo-products';

export type Product = Database['public']['Tables']['products']['Row'];
export type Order = Database['public']['Tables']['orders']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];

export async function getAllProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching products, showing the built-in demo catalogue:', error.message);
    return DEMO_PRODUCTS;
  }

  return data && data.length > 0 ? data : DEMO_PRODUCTS;
}

export async function getProductById(id: number): Promise<Product | null> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error('Error fetching product, trying the built-in demo catalogue:', error.message);
    return DEMO_PRODUCTS.find((product) => product.id === id) ?? null;
  }

  return data;
}

export async function createOrder(orderData: {
  product_id: number;
  quantity: number;
  total_amount: number;
  customer_email?: string;
}): Promise<Order | null> {
  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .insert([{
      ...orderData,
      payment_status: 'pending'
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    return null;
  }

  return data;
}

export async function updateOrderPaymentStatus(
  orderId: number, 
  paymentStatus: string, 
  paymentId?: string,
  paymentMethod?: string,
  paymentAmount?: number
): Promise<Order | null> {
  const updateData: any = { 
    payment_status: paymentStatus,
    payment_id: paymentId,
    updated_at: new Date().toISOString()
  };

  if (paymentMethod) {
    updateData.payment_method = paymentMethod;
  }

  if (paymentAmount) {
    updateData.payment_amount = paymentAmount;
  }

  if (paymentStatus === 'completed') {
    updateData.payment_completed_at = new Date().toISOString();
  }

  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order:', error);
    return null;
  }

  return data;
}

export async function createPaymentRecord(paymentData: {
  order_id: number;
  payment_method: string;
  payment_provider_id?: string;
  amount: number;
  currency?: string;
  status?: string;
  provider_response?: any;
}): Promise<Payment | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('payments')
      .insert([{
        ...paymentData,
        currency: paymentData.currency || 'JPY',
        status: paymentData.status || 'pending'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      // Return a mock payment record if the table doesn't exist
      return {
        id: Date.now(),
        order_id: paymentData.order_id,
        payment_method: paymentData.payment_method,
        payment_provider_id: paymentData.payment_provider_id || null,
        amount: paymentData.amount,
        currency: paymentData.currency || 'JPY',
        status: paymentData.status || 'pending',
        provider_response: paymentData.provider_response,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    return data;
  } catch (error) {
    console.error('Payment record creation failed:', error);
    // Return a mock payment record
    return {
      id: Date.now(),
      order_id: paymentData.order_id,
      payment_method: paymentData.payment_method,
      payment_provider_id: paymentData.payment_provider_id || null,
      amount: paymentData.amount,
      currency: paymentData.currency || 'JPY',
      status: paymentData.status || 'pending',
      provider_response: paymentData.provider_response,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export async function updatePaymentRecord(
  paymentId: number,
  updateData: {
    status?: string;
    payment_provider_id?: string;
    provider_response?: any;
  }
): Promise<Payment | null> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('payments')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment record:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Payment record update failed:', error);
    return null;
  }
}

export async function getOrderWithPayments(orderId: number): Promise<any> {
  const { data, error } = await getSupabaseAdmin()
    .from('orders')
    .select(`
      *,
      products (*),
      payments (*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order with payments:', error);
    return null;
  }

  return data;
}
