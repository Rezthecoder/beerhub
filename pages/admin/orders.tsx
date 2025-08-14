import { GetServerSideProps } from 'next';
import Layout from '../../components/Layout';
import ReceiptGenerator from '../../components/ReceiptGenerator';
import { supabase } from '../../lib/supabase';

interface OrderWithDetails {
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

interface AdminOrdersProps {
    orders: OrderWithDetails[];
}

export default function AdminOrders({ orders }: AdminOrdersProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusClasses = {
            completed: 'bg-success',
            pending: 'bg-warning',
            failed: 'bg-danger'
        };
        return statusClasses[status as keyof typeof statusClasses] || 'bg-secondary';
    };

    const generateReceiptData = (order: OrderWithDetails) => {
        return {
            orderId: `ORD-${order.id}`,
            customerName: order.customer_email?.split('@')[0] || 'Customer',
            customerEmail: order.customer_email || '',
            items: [
                {
                    name: order.products.name,
                    quantity: order.quantity,
                    price: order.products.price,
                    total: order.total_amount
                }
            ],
            subtotal: Math.round(order.total_amount / 1.1),
            tax: Math.round(order.total_amount - (order.total_amount / 1.1)),
            total: order.total_amount,
            paymentMethod: order.payment_method || 'Unknown',
            orderDate: order.created_at,
            deliveryAddress: 'Customer Address'
        };
    };

    return (
        <Layout title="Order Management - Food & Beer Shop">
            <div className="container py-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Order Management</h1>
                    <span className="badge bg-primary fs-6">{orders.length} Total Orders</span>
                </div>

                <div className="row">
                    <div className="col-12">
                        <div className="card shadow">
                            <div className="card-header">
                                <h5 className="mb-0">Recent Orders</h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Amount</th>
                                                <th>Payment Method</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Customer</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td>
                                                        <strong>#{order.id}</strong>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={order.products.image}
                                                                alt={order.products.name}
                                                                className="rounded me-2"
                                                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                            />
                                                            <div>
                                                                <div className="fw-medium">{order.products.name}</div>
                                                                <small className="text-muted">¥{order.products.price}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{order.quantity}</td>
                                                    <td>
                                                        <strong>¥{order.total_amount.toLocaleString()}</strong>
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-info text-capitalize">
                                                            {order.payment_method || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${getStatusBadge(order.payment_status)} text-capitalize`}>
                                                            {order.payment_status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div>{formatDate(order.created_at)}</div>
                                                        {order.payment_completed_at && (
                                                            <small className="text-success">
                                                                Paid: {formatDate(order.payment_completed_at)}
                                                            </small>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {order.customer_email ? (
                                                            <small>{order.customer_email}</small>
                                                        ) : (
                                                            <span className="text-muted">Guest</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <ReceiptGenerator
                                                            receiptData={generateReceiptData(order)}
                                                            onDownload={() => console.log(`Receipt downloaded for order ${order.id}`)}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="row mt-4">
                    <div className="col-md-4">
                        <div className="card bg-success text-white">
                            <div className="card-body">
                                <h5>Completed Orders</h5>
                                <h3>{orders.filter(o => o.payment_status === 'completed').length}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-warning text-white">
                            <div className="card-body">
                                <h5>Pending Orders</h5>
                                <h3>{orders.filter(o => o.payment_status === 'pending').length}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card bg-primary text-white">
                            <div className="card-body">
                                <h5>Total Revenue</h5>
                                <h3>¥{orders
                                    .filter(o => o.payment_status === 'completed')
                                    .reduce((sum, o) => sum + o.total_amount, 0)
                                    .toLocaleString()}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}

export const getServerSideProps: GetServerSideProps = async () => {
    try {
        // First try to get orders with products only
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
        *,
        products (*)
      `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Error fetching orders:', error);
            return {
                props: {
                    orders: []
                }
            };
        }

        // Try to add payment data if payments table exists
        if (orders) {
            for (let order of orders) {
                try {
                    const { data: payments } = await supabase
                        .from('payments')
                        .select('*')
                        .eq('order_id', order.id);

                    order.payments = payments || [];
                } catch (paymentError) {
                    // Payments table might not exist, set empty array
                    order.payments = [];
                }
            }
        }

        return {
            props: {
                orders: orders || []
            }
        };
    } catch (error) {
        console.error('Server error:', error);
        return {
            props: {
                orders: []
            }
        };
    }
};