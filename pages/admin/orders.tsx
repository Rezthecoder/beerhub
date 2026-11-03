import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { getSupabaseAdmin } from '../../lib/supabase';

interface AdminOrder {
  id: number;
  quantity: number;
  total_amount: number;
  payment_status: string;
  payment_method: string | null;
  payment_completed_at: string | null;
  customer_email: string | null;
  created_at: string;
  products: { name: string; price: number; image: string } | null;
}

interface AdminOrdersProps {
  orders: AdminOrder[];
  databaseError: boolean;
}

const STATUS_BG: Record<string, string> = {
  completed: 'var(--mint)',
  pending: 'var(--peach)',
  pending_cod: 'var(--peach)',
  failed: 'var(--coral-soft)',
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Password-protected by middleware.ts (ADMIN_USER / ADMIN_PASSWORD). */
export default function AdminOrders({ orders, databaseError }: AdminOrdersProps) {
  const paid = orders.filter((o) => o.payment_status === 'completed');
  const revenue = paid.reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <Layout title="Orders - BeerHub admin">
      <div className="container" style={{ padding: '3rem 1.25rem 5rem' }}>
        <h1 className="section-title">Orders</h1>
        <p className="section-intro">The 50 most recent orders. All payments are test payments.</p>

        {databaseError && (
          <p className="alert alert-error" role="alert" style={{ marginTop: '1.5rem' }}>
            Could not reach the order database. Check that the Supabase project is running and SUPABASE_SERVICE_ROLE_KEY is set.
          </p>
        )}

        <div className="stats">
          <div className="stat brut-sm bg-sand">
            <span className="muted">Orders</span>
            <strong>{orders.length}</strong>
          </div>
          <div className="stat brut-sm bg-mint">
            <span>Paid</span>
            <strong>{paid.length}</strong>
          </div>
          <div className="stat brut-sm bg-beer">
            <span>Test revenue</span>
            <strong>¥{revenue.toLocaleString()}</strong>
          </div>
        </div>

        <div className="brut table-wrap">
          {orders.length === 0 ? (
            <p style={{ padding: '2rem' }} className="muted">
              No orders yet. Place one from the shop to see it here.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Beer</th>
                  <th>Qty</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Placed</th>
                  <th>Email</th>
                  <th>
                    <span className="visually-hidden">Receipt</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 800 }}>#{o.id}</td>
                    <td>{o.products?.name ?? 'Unknown product'}</td>
                    <td>{o.quantity}</td>
                    <td style={{ fontWeight: 700 }}>¥{o.total_amount.toLocaleString()}</td>
                    <td>{o.payment_method ?? 'not chosen'}</td>
                    <td>
                      <span className="chip" style={{ background: STATUS_BG[o.payment_status] ?? 'var(--sky)' }}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td>{formatDate(o.created_at)}</td>
                    <td>{o.customer_email ?? ''}</td>
                    <td>
                      <Link href={`/payment/success?orderId=${o.id}`}>Receipt</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<AdminOrdersProps> = async () => {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .select('id, quantity, total_amount, payment_status, payment_method, payment_completed_at, customer_email, created_at, products (name, price, image)')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching orders:', error.message);
      return { props: { orders: [], databaseError: true } };
    }
    return { props: { orders: (data as unknown as AdminOrder[]) ?? [], databaseError: false } };
  } catch (error: any) {
    console.error('Admin orders failed:', error?.message);
    return { props: { orders: [], databaseError: true } };
  }
};
