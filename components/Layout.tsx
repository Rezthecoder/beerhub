import Head from 'next/head';
import Link from 'next/link';
import type { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== 'false';

export default function Layout({ children, title = 'BeerHub - Japanese beer delivery (demo)' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="BeerHub is a demo online shop for Japanese beer by RezX Kaihatsu: browse Kirin, Sapporo and more, and try checkout with Stripe test cards or the PayPay sandbox."
        />
        <link rel="icon" href="/images/logo.png" />
      </Head>

      <header className="site-header">
        <div className="container">
          <Link href="/" className="wordmark" aria-label="BeerHub home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="" width={36} height={36} />
            <span>
              Beer<em>Hub</em>
            </span>
          </Link>
          <nav className="site-nav" aria-label="Main">
            <Link href="/#beers" className="link">
              Beers
            </Link>
            <Link href="/#how" className="link">
              How it works
            </Link>
            <Link href="/#beers" className="btn bg-beer" style={{ padding: '0.5rem 1rem', fontSize: '0.95rem' }}>
              Shop now
            </Link>
          </nav>
        </div>
      </header>

      {DEMO_MODE && (
        <div role="note" className="demo-notice">
          <strong>Demo store by RezX Kaihatsu:</strong> payments are in test mode and nothing is shipped.{' '}
          <span className="card-hint">Test card 4242 4242 4242 4242, any future date, any CVC.</span>
          <br />
          <span lang="ja">デモサイトです。決済はテストモードで、商品は発送されません。</span>
        </div>
      )}

      <main>{children}</main>

      <footer className="site-footer">
        <div className="container">
          <span>BeerHub © {new Date().getFullYear()}. A portfolio demo, not a real shop.</span>
          <span>
            Built by{' '}
            <a href="https://rezxkaihatsu.com" target="_blank" rel="noopener noreferrer">
              RezX Kaihatsu
            </a>
          </span>
        </div>
      </footer>
    </>
  );
}
