import { useRef, useState } from 'react';

export interface ReceiptData {
  reference: string;
  customerEmail?: string;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
  /** Amount actually paid, tax included */
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  date: string;
}

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
}

/** Japanese consumption tax (10%) contained in a tax-inclusive price */
const includedTax = (total: number) => Math.round((total * 10) / 110);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function ReceiptGenerator({ receiptData }: ReceiptGeneratorProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const downloadPdf = async () => {
    if (!receiptRef.current) return;
    setBusy(true);
    setError('');
    try {
      // Loaded on demand so they don't slow down the page
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = 190;
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, height);
      pdf.save(`BeerHub-receipt-${receiptData.reference}.pdf`);
    } catch {
      setError('Could not create the PDF. Try again, or print this page instead.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container">
      <div className="receipt brut">
        <div ref={receiptRef} style={{ background: '#fff', padding: '0.25rem' }}>
          <div className="receipt-head">
            <div>
              <p style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.03em' }}>BeerHub receipt</p>
              <p className="muted" style={{ fontSize: '0.85rem' }}>
                Demo store by RezX Kaihatsu. Test payment, no goods shipped.
              </p>
            </div>
            <span className="chip" style={{ background: receiptData.paymentStatus === 'Paid' ? 'var(--mint)' : 'var(--peach)' }}>
              {receiptData.paymentStatus}
            </span>
          </div>

          <dl>
            <dt>Reference</dt>
            <dd>{receiptData.reference}</dd>
            <dt>Date</dt>
            <dd>{formatDate(receiptData.date)}</dd>
            <dt>Payment</dt>
            <dd>{receiptData.paymentMethod}</dd>
            {receiptData.paymentId && (
              <>
                <dt>Payment ID</dt>
                <dd>{receiptData.paymentId}</dd>
              </>
            )}
            {receiptData.customerEmail && (
              <>
                <dt>Email</dt>
                <dd>{receiptData.customerEmail}</dd>
              </>
            )}
          </dl>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="num">Qty</th>
                <th className="num">Price</th>
                <th className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {receiptData.items.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">¥{item.price.toLocaleString()}</td>
                  <td className="num">¥{item.total.toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="muted">
                  Includes 10% consumption tax
                </td>
                <td className="num muted">¥{includedTax(receiptData.total).toLocaleString()}</td>
              </tr>
              <tr className="grand">
                <td colSpan={3}>Total paid</td>
                <td className="num">¥{receiptData.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.75rem' }}>
          <button type="button" className="btn bg-beer" onClick={downloadPdf} disabled={busy}>
            {busy ? 'Making PDF…' : 'Download PDF receipt'}
          </button>
          <button type="button" className="btn" onClick={() => window.print()}>
            Print
          </button>
        </div>
        {error && (
          <p className="alert alert-error" role="alert" style={{ marginTop: '1rem' }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
