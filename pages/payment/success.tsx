import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import ReceiptGenerator from '../../components/ReceiptGenerator';

interface OrderDetails {
  id: number;
  product_id: number;
  quantity: number;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  payment_completed_at: string;
  customer_email: string;
  created_at: string;
  products: {
    name: string;
    price: number;
    image: string;
  };
  payments: Array<{
    id: number;
    payment_method: string;
    amount: number;
    status: string;
    payment_provider_id: string;
    created_at: string;
  }>;
}

export default function PaymentSuccess() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (router.query.orderId) {
      setOrderId(router.query.orderId as string);
      fetchOrderDetails(router.query.orderId as string);
    }
    if (router.query.method) {
      setPaymentMethod(router.query.method as string);
    }
  }, [router.query]);

  const fetchOrderDetails = async (orderId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/order-details?orderId=${orderId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch order details');
      }
      
      const data = await response.json();
      setOrderDetails(data.order);
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Generate receipt data from real order details
  const getReceiptData = () => {
    if (!orderDetails) return null;

    const paymentRecord = orderDetails.payments?.[0];
    const product = orderDetails.products;
    
    return {
      orderId: `ORD-${orderDetails.id}`,
      customerName: orderDetails.customer_email ? orderDetails.customer_email.split('@')[0] : 'Customer',
      customerEmail: orderDetails.customer_email || 'No email provided',
      items: [
        {
          name: product.name,
          quantity: orderDetails.quantity,
          price: product.price,
          total: orderDetails.total_amount
        }
      ],
      subtotal: orderDetails.total_amount,
      tax: Math.round(orderDetails.total_amount * 0.1), // 10% tax
      total: orderDetails.total_amount + Math.round(orderDetails.total_amount * 0.1),
      paymentMethod: paymentRecord ? 
        (paymentRecord.payment_method === 'paypay' ? 'PayPay' : 
         paymentRecord.payment_method === 'stripe' ? 'Credit Card' : 
         paymentRecord.payment_method === 'cod' ? 'Cash on Delivery' : 
         paymentRecord.payment_method) : 
        'Unknown',
      orderDate: orderDetails.created_at,
      deliveryAddress: '123 Tokyo Street, Shibuya, Tokyo 150-0001', // Default address
      paymentStatus: orderDetails.payment_status,
      paymentCompletedAt: orderDetails.payment_completed_at
    };
  };

  if (loading) {
    return (
      <Layout title="Payment Success - Food & Beer Shop">
        <div className="container py-3 py-md-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body py-4 py-md-5 px-3 px-md-4">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-3">Loading order details...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Payment Success - Food & Beer Shop">
        <div className="container py-3 py-md-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body py-4 py-md-5 px-3 px-md-4">
                  <div className="text-danger mb-3" style={{ fontSize: 'min(4rem, 15vw)' }}>
                    ⚠️
                  </div>
                  <h2 className="text-danger mb-3 fs-3 fs-md-2">Error Loading Order</h2>
                  <p className="text-muted mb-4">{error}</p>
                  <button
                    onClick={() => router.push('/')}
                    className="btn btn-primary py-2 py-md-3"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const receiptData = getReceiptData();

  if (!receiptData) {
    return (
      <Layout title="Payment Success - Food & Beer Shop">
        <div className="container py-3 py-md-5">
          <div className="row justify-content-center">
            <div className="col-12 col-md-6 text-center">
              <div className="card shadow">
                <div className="card-body py-4 py-md-5 px-3 px-md-4">
                  <div className="text-warning mb-3" style={{ fontSize: 'min(4rem, 15vw)' }}>
                    ⚠️
                  </div>
                  <h2 className="text-warning mb-3 fs-3 fs-md-2">Order Not Found</h2>
                  <p className="text-muted mb-4">Unable to load order details.</p>
                  <button
                    onClick={() => router.push('/')}
                    className="btn btn-primary py-2 py-md-3"
                  >
                    Return to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Payment Success - Food & Beer Shop">
      <div className="container py-3 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <div className="card shadow">
              <div className="card-body py-4 py-md-5 px-3 px-md-4">
                <div className="mb-4">
                  <div className="text-success" style={{ fontSize: 'min(4rem, 15vw)' }}>
                    ✓
                  </div>
                </div>
                <h2 className="text-success mb-3 fs-3 fs-md-2">Payment Successful!</h2>
                <p className="text-muted mb-4">
                  Thank you for your order.<br />
                  A confirmation email has been sent to you.
                </p>
                {orderId && (
                  <p className="small text-muted mb-4">
                    Order ID: {orderId}
                  </p>
                )}
                <div className="d-grid gap-2">
                  <ReceiptGenerator
                    receiptData={receiptData}
                    onDownload={() => console.log('Receipt downloaded')}
                  />
                  <button
                    onClick={() => router.push('/')}
                    className="btn btn-primary py-2 py-md-3"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => router.push('/admin/orders')}
                    className="btn btn-outline-secondary py-2 py-md-3"
                  >
                    View Order History
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}