import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import QRCode from 'qrcode';

interface PayPayCheckoutProps {
  productId: number;
  quantity: number;
  totalAmount: number;
  customerEmail: string;
}

type Phase = 'idle' | 'creating' | 'waiting' | 'failed';

const POLL_MS = 4500; // PayPay recommends checking every 4-5 seconds
const isMobile = () => typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function PayPayCheckout({ productId, quantity, totalAmount, customerEmail }: PayPayCheckoutProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<{ mpid: string; url: string; qr: string; expiresAt?: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stopPolling, []);

  const poll = useCallback(
    (mpid: string, expiresAt?: string) => {
      const check = async () => {
        try {
          const res = await fetch(`/api/paypay/status?mpid=${encodeURIComponent(mpid)}`, { cache: 'no-store' });
          const data = await res.json();
          if (res.ok && data.state === 'paid') {
            stopPolling();
            router.push(`/payment/success?method=paypay&mpid=${encodeURIComponent(mpid)}`);
            return;
          }
          if (res.ok && data.state === 'failed') {
            stopPolling();
            setPhase('failed');
            setError(
              data.paypayStatus === 'EXPIRED'
                ? 'The PayPay code expired before payment. Start a new one.'
                : 'The PayPay payment was cancelled or failed. Nothing was charged.'
            );
            return;
          }
        } catch {
          /* network blip: try again on the next tick */
        }
        if (expiresAt && Date.now() > new Date(expiresAt).getTime() + 30_000) {
          stopPolling();
          setPhase('failed');
          setError('The PayPay code expired before payment. Start a new one.');
          return;
        }
        timer.current = setTimeout(check, POLL_MS);
      };
      timer.current = setTimeout(check, POLL_MS);
    },
    [router]
  );

  const start = async () => {
    stopPolling();
    setError('');
    setPhase('creating');
    try {
      const res = await fetch('/api/paypay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity, customerEmail }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'PayPay could not start the payment.');

      // On a phone, go straight to PayPay; it opens the app or the web payment page.
      if (isMobile()) {
        window.location.href = data.paymentUrl;
        return;
      }

      const qr = await QRCode.toDataURL(data.paymentUrl, { margin: 1, width: 416, errorCorrectionLevel: 'M' });
      setPayment({ mpid: data.merchantPaymentId, url: data.paymentUrl, qr, expiresAt: data.expiresAt });
      setPhase('waiting');
      poll(data.merchantPaymentId, data.expiresAt);
    } catch (err: any) {
      setPhase('failed');
      setError(err.message || 'PayPay could not start the payment.');
    }
  };

  const cancel = () => {
    stopPolling();
    setPayment(null);
    setPhase('idle');
  };

  return (
    <div>
      <p className="muted">
        Pay with the PayPay app or PayPay&apos;s payment page. This demo uses the <strong>PayPay sandbox</strong>, so no real money
        moves; sign in with a PayPay sandbox test account to complete the payment.
      </p>

      {phase !== 'waiting' && (
        <button
          type="button"
          className="btn btn-lg btn-block btn-paypay"
          style={{ marginTop: '1.25rem' }}
          onClick={start}
          disabled={phase === 'creating'}
        >
          {phase === 'creating' ? (
            <>
              <span className="spinner spinner-sm" aria-hidden="true" style={{ borderColor: '#fff', borderRightColor: 'transparent' }} />{' '}
              Starting PayPay…
            </>
          ) : (
            <>Pay ¥{totalAmount.toLocaleString()} with PayPay</>
          )}
        </button>
      )}

      {error && (
        <p className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
          {error}
        </p>
      )}

      {phase === 'waiting' && payment && (
        <div className="paypay-box brut-sm">
          <div className="qr brut-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={payment.qr} alt="PayPay payment QR code" />
          </div>
          <div>
            <p style={{ fontWeight: 800, fontSize: '1.15rem' }}>Scan with PayPay</p>
            <ol className="steps">
              <li>Open the PayPay sandbox app and scan this code, or</li>
              <li>open the payment page on this computer.</li>
              <li>This page moves on by itself once PayPay confirms.</li>
            </ol>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.25rem' }}>
              <a href={payment.url} target="_blank" rel="noopener noreferrer" className="btn btn-paypay">
                Open payment page
              </a>
              <button type="button" className="btn" onClick={cancel}>
                Cancel
              </button>
            </div>
            <p className="status-line" role="status" style={{ marginTop: '1.25rem' }}>
              <span className="spinner spinner-sm" aria-hidden="true" /> Waiting for PayPay…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
