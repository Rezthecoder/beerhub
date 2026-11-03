import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';

const REASONS: Record<string, string> = {
  CANCELED: 'The payment was cancelled.',
  EXPIRED: 'The payment code expired before it was paid.',
  FAILED: 'The payment provider declined the payment.',
  timeout: 'We did not hear back from the payment provider in time.',
};

export default function PaymentFailed() {
  const router = useRouter();
  const reason = typeof router.query.reason === 'string' ? router.query.reason : '';

  return (
    <Layout title="Payment not completed - BeerHub">
      <div className="container">
        <div className="result brut">
          <span className="badge-icon bg-coral-soft" aria-hidden="true">
            ×
          </span>
          <h1>Payment not completed</h1>
          <p>{REASONS[reason] || 'Something went wrong while paying.'} Nothing was charged.</p>
          <div className="actions">
            <button type="button" className="btn bg-beer" onClick={() => router.back()}>
              Try again
            </button>
            <Link href="/#beers" className="btn">
              Back to the beers
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
