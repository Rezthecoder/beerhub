import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'BeerHub - Premium Japanese Beer' }: LayoutProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isNavOpen && !target.closest('.navbar') && !target.closest('.navbar-collapse')) {
        closeNav();
      }
    };

    // Close menu on escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isNavOpen) {
        closeNav();
      }
    };

    if (isNavOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent body scroll
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = ''; // Restore body scroll
    };
  }, [isNavOpen]);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta charSet="UTF-8" />
        <meta name="description" content="Premium Japanese beer delivery. Kirin, Sapporo, Asahi and more craft beers delivered fresh to your door." />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
      </Head>

      <nav className="navbar navbar-expand-lg navbar-light w-100">
        <div className="container-fluid px-4">
          <Link href="/" className="navbar-brand d-flex align-items-center">
            <div className="logo-container me-3">
              <Image
                src="/images/logo.png"
                alt="BeerHub Logo"
                width={40}
                height={40}
                className="logo-image"
              />
            </div>
            <span
              className="brand-text"
              style={{
                background: 'linear-gradient(90deg, #FFD600 0%, #FF8C42 50%, #FF3C38 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 700,
                letterSpacing: '2px'
              }}
            >
              BeerHub
            </span>
          </Link>

          {/* Mobile Toggle */}
          <button
            className={`navbar-toggler d-lg-none ${isNavOpen ? 'd-none' : ''}`}
            type="button"
            aria-controls="navbarNav"
            aria-expanded={isNavOpen}
            aria-label="Toggle navigation"
            onClick={toggleNav}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Mobile Menu */}
          <div className={`collapse navbar-collapse ${isNavOpen ? 'show' : ''}`} id="navbarNav">
            {/* Mobile close button */}
            <button
              className="mobile-close-btn d-lg-none"
              onClick={closeNav}
              aria-label="Close menu"
            >
              ✕
            </button>

            <div className="navbar-nav ms-auto">
              <Link href="/" className="nav-link" onClick={closeNav}>
                Home
              </Link>
              <a href="#categories" className="nav-link" onClick={closeNav}>
                Categories
              </a>
              <Link href="/admin/orders" className="nav-link" onClick={closeNav}>
                Admin
              </Link>
              <a href="#about" className="nav-link" onClick={closeNav}>
                About
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      {/* Floating beer bubbles */}
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>
      <div className="floating-bubble"></div>

      {/* Beer foam effect */}
      <div className="foam-effect"></div>
      <div className="foam-effect"></div>

      <footer className="bg-dark text-white py-4">
        <div className="container">
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <h5 className="text-warning"><img src="/images/logo.png" alt="BeerHub Logo" style={{ width: '2rem', height: '2rem' }} /> BeerHub</h5>
              <p className="mb-0">Premium Japanese beer delivered fresh to your door.</p>
            </div>
            <div className="col-12 col-md-6 text-center text-md-end">
              <p className="mb-0">&copy; 2025 BeerHub. All rights reserved.</p>
              <small className="text-muted">Drink responsibly. Must be 20+ years old.</small>
            </div>
          </div>
        </div>
      </footer>

      <script
        src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"
        async
      />
    </>
  );
}