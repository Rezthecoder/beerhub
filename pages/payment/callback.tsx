import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';

type View = 'checking' | 'failed' | 'slow' | 'error';

const POLL_MS = 3000;
const MAX_ATTEMPTS = 20; // about a minute

/**
 * PayPay sends the customer here after they finish on its payment page.
 * We confirm the result with PayPay (via our API) before showing success.
 */
export default function PayPayCallback() {
  const router = useRouter();
  const [view, setView] = useState<View>('checking');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    if (!router.isReady) return;
    const mpid = typeof router.query.mpid === 'string' ? router.query.mpid : '';
    if (!mpid) {
      setView('error');
      setDetail('This link is missing the payment reference.');
      return;
    }

    let attempt = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const check = async () => {
      attempt += 1;
      try {
        const res = await fetch(`/api/paypay/status?mpid=${encodeURIComponent(mpid)}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.state === 'paid') {
          router.replace(`/payment/success?method=paypay&mpid=${encodeURIComponent(mpid)}`);
          return;
        }
        if (res.ok && data.state === 'failed') {
          setView('failed');
          setDetail(data.paypayStatus === 'EXPIRED' ? 'The payment code expired before it was paid.' : 'The payment was cancelled.');
          return;
        }
      } catch {
        /* try again */
      }
      if (attempt >= MAX_ATTEMPTS) {
        setView('slow');
        return;
      }
      timer = setTimeout(check, POLL_MS);
    };

    check();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [router.isReady, router.query.mpid, router]);

  return (
    <Layout title="Checking your PayPay payment - BeerHub">
      <div className="container">
        <div className="result brut">
          {view === 'checking' && (
            <>
              <div style={{ display: 'grid', placeItems: 'center', marginBottom: '1.5rem' }}>
                <div className="spinner" aria-hidden="true" />
              </div>
              <h1>Checking with PayPay…</h1>
              <p role="status">This usually takes a few seconds. Please keep this page open.</p>
            </>
          )}

          {view === 'failed' && (
            <>
              <span className="badge-icon bg-coral-soft" aria-hidden="true">
                ×
              </span>
              <h1>Payment not completed</h1>
              <p>{detail} Nothing was charged.</p>
              <div className="actions">
                <Link href="/#beers" className="btn bg-beer">
                  Back to the beers
                </Link>
              </div>
            </>
          )}

          {view === 'slow' && (
            <>
              <span className="badge-icon bg-peach" aria-hidden="true">
                …
              </span>
              <h1>Still waiting for PayPay</h1>
              <p>PayPay hasn&apos;t confirmed the payment yet. If you finished paying, check again in a moment.</p>
              <div className="actions">
                <button type="button" className="btn bg-beer" onClick={() => router.reload()}>
                  Check again
                </button>
                <Link href="/" className="btn">
                  Home
                </Link>
              </div>
            </>
          )}

          {view === 'error' && (
            <>
              <span className="badge-icon bg-coral-soft" aria-hidden="true">
                !
              </span>
              <h1>We couldn&apos;t find that payment</h1>
              <p>{detail}</p>
              <div className="actions">
                <Link href="/" className="btn bg-beer">
                  Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
