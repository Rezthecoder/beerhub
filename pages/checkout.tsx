import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import StripePayment from '../components/StripePayment';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch product data from API
  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);

      // Replace this with your actual API endpoint
      const response = await fetch(`/api/products/${productId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const productData = await response.json();
      setProduct(productData);
      setTotal(productData.price * parseInt(router.query.quantity as string));
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.isReady) {
      const { productId, quantity, method, payment } = router.query;

      if (productId && quantity) {
        const productIdNum = parseInt(productId as string);
        fetchProduct(productIdNum);
      }
    }
  }, [router.isReady, router.query]);

  // Responsive styles
  const containerStyle = {
    maxWidth: 'clamp(600px, 80vw, 900px)',
    width: '100%',
    margin: '0 auto',
    padding: 'clamp(20px, 4vw, 40px)',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  };

  const headerStyle = {
    textAlign: 'center' as const,
    marginBottom: '20px'
  };

  const titleStyle = {
    fontSize: 'clamp(24px, 5vw, 32px)',
    marginBottom: '10px',
    color: '#1a1a1a',
    fontWeight: 'bold'
  };

  const subtitleStyle = {
    fontSize: 'clamp(16px, 3vw, 18px)',
    color: '#666',
    marginBottom: '20px'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: 'clamp(20px, 4vw, 40px)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    maxWidth: '100%'
  };

  const orderSummaryStyle = {
    marginBottom: '30px',
    textAlign: 'center' as const
  };

  const orderSummaryCardStyle = {
    padding: 'clamp(16px, 3vw, 20px)',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px'
  };

  const productInfoStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    alignItems: 'center',
    marginBottom: '15px'
  };

  const productNameStyle = {
    fontSize: 'clamp(18px, 4vw, 22px)',
    fontWeight: 'bold',
    color: '#1a1a1a'
  };

  const priceStyle = {
    fontSize: 'clamp(16px, 3vw, 18px)',
    color: '#666'
  };

  const totalStyle = {
    fontSize: 'clamp(20px, 4vw, 24px)',
    fontWeight: 'bold',
    color: '#059669',
    padding: '15px',
    backgroundColor: '#ecfdf5',
    borderRadius: '8px',
    border: '2px solid #059669'
  };

  const paymentMethodStyle = {
    marginBottom: '30px'
  };

  const methodTabsStyle = {
    display: 'flex',
    gap: 'clamp(10px, 2vw, 20px)',
    marginBottom: '20px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
    width: '100%'
  };

  const methodTabStyle = (isSelected: boolean) => ({
    flex: '1',
    minWidth: 'clamp(120px, 20vw, 200px)',
    padding: 'clamp(16px, 3vw, 24px)',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: isSelected ? '#059669' : '#f3f4f6',
    color: isSelected ? 'white' : '#374151',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 2.5vw, 18px)',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  });

  const paypaySectionStyle = {
    textAlign: 'center' as const,
    padding: '20px'
  };

  const paypayLogoStyle = {
    width: 'clamp(80px, 15vw, 120px)',
    height: 'auto',
    marginBottom: '10px'
  };

  const paypayButtonStyle = {
    padding: 'clamp(12px, 3vw, 16px) 24px',
    backgroundColor: '#00c851',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    margin: '0 auto'
  };

  const errorMessageStyle = {
    padding: '16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #dc2626',
    borderRadius: '6px',
    color: '#dc2626',
    marginBottom: '20px',
    textAlign: 'center' as const
  };

  const navigationStyle = {
    display: 'flex',
    gap: 'clamp(15px, 3vw, 25px)',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    marginTop: '20px'
  };

  const navButtonStyle = {
    padding: 'clamp(10px, 2.5vw, 14px) 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block'
  };

  const testButtonStyle = {
    padding: 'clamp(10px, 2.5vw, 14px) 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block'
  };

  // If no product or quantity, show payment method selection
  if (!router.query.productId || !router.query.quantity) {
    return (
      <>
        {/* Navbar */}
        <nav style={{
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem 0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ marginRight: '12px' }}>
                  <Image
                    src="/images/logo.png"
                    alt="BeerHub Logo"
                    width={40}
                    height={40}
                  />
                </div>
                <span style={{
                  background: 'linear-gradient(90deg, #FFD600 0%, #FF8C42 50%, #FF3C38 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  fontSize: '24px'
                }}>
                  BeerHub
                </span>
              </Link>

              <div style={{ display: 'flex', gap: '20px' }}>
                <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Home
                </Link>
                <a href="#categories" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Categories
                </a>
                <Link href="/admin/orders" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div style={{ ...containerStyle, marginTop: '100px' }}>
          <div style={headerStyle}>
            <h1 style={titleStyle}>🍺 Beer Checkout</h1>
            <p style={subtitleStyle}>Select your preferred payment method</p>
          </div>

          <div style={cardStyle}>
            <div style={paymentMethodStyle}>
              <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#1a1a1a' }}>
                Choose Payment Method
              </h3>

              <div style={methodTabsStyle}>
                <button
                  onClick={() => router.push('/checkout?productId=3&quantity=1&method=card')}
                  style={methodTabStyle(false)}
                >
                  💳 Credit Card
                </button>
                <button
                  onClick={() => router.push('/checkout?productId=3&quantity=1&method=paypay')}
                  style={methodTabStyle(false)}
                >
                  <img
                    src="https://js.stripe.com/v3/fingerprinted/img/PayPayLogo-dd66645813dbeee2ca8887077353723a.svg"
                    alt="PayPay"
                    style={{ width: '20px', height: '20px' }}
                  />
                  PayPay
                </button>
              </div>
            </div>

            <div style={navigationStyle}>
              <Link href="/" style={navButtonStyle}>
                🏠 Return to Home
              </Link>
              <Link href="/test-checkout" style={testButtonStyle}>
                🧪 Test Checkout
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show loading state
  if (loading) {
    return (
      <>
        {/* Navbar */}
        <nav style={{
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem 0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ marginRight: '12px' }}>
                  <Image
                    src="/images/logo.png"
                    alt="BeerHub Logo"
                    width={40}
                    height={40}
                  />
                </div>
                <span style={{
                  background: 'linear-gradient(90deg, #FFD600 0%, #FF8C42 50%, #FF3C38 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  fontSize: '24px'
                }}>
                  BeerHub
                </span>
              </Link>

              <div style={{ display: 'flex', gap: '20px' }}>
                <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Home
                </Link>
                <a href="#categories" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Categories
                </a>
                <Link href="/admin/orders" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div style={{ ...containerStyle, marginTop: '100px' }}>
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>⏳</div>
              <h2 style={{ color: '#1a1a1a', marginBottom: '10px' }}>Loading Product...</h2>
              <p style={{ color: '#666' }}>Please wait while we fetch your product details.</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        {/* Navbar */}
        <nav style={{
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem 0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ marginRight: '12px' }}>
                  <Image
                    src="/images/logo.png"
                    alt="BeerHub Logo"
                    width={40}
                    height={40}
                  />
                </div>
                <span style={{
                  background: 'linear-gradient(90deg, #FFD600 0%, #FF8C42 50%, #FF3C38 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  fontSize: '24px'
                }}>
                  BeerHub
                </span>
              </Link>

              <div style={{ display: 'flex', gap: '20px' }}>
                <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Home
                </Link>
                <a href="#categories" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Categories
                </a>
                <Link href="/admin/orders" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div style={{ ...containerStyle, marginTop: '100px' }}>
          <div style={headerStyle}>
            <h1 style={titleStyle}>❌ Error Loading Product</h1>
            <p style={subtitleStyle}>Unable to load the requested product.</p>
          </div>

          <div style={cardStyle}>
            <div style={errorMessageStyle}>
              <strong>Error:</strong> {error}
            </div>

            <div style={navigationStyle}>
              <Link href="/" style={navButtonStyle}>
                🏠 Return to Home
              </Link>
              <button
                onClick={() => fetchProduct(parseInt(router.query.productId as string))}
                style={testButtonStyle}
              >
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // If product not found, show error
  if (!product) {
    return (
      <>
        {/* Navbar */}
        <nav style={{
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '1rem 0',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                <div style={{ marginRight: '12px' }}>
                  <Image
                    src="/images/logo.png"
                    alt="BeerHub Logo"
                    width={40}
                    height={40}
                  />
                </div>
                <span style={{
                  background: 'linear-gradient(90deg, #FFD600 0%, #FF8C42 50%, #FF3C38 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontWeight: '700',
                  letterSpacing: '2px',
                  fontSize: '24px'
                }}>
                  BeerHub
                </span>
              </Link>

              <div style={{ display: 'flex', gap: '20px' }}>
                <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Home
                </Link>
                <a href="#categories" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Categories
                </a>
                <Link href="/admin/orders" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <div style={{ ...containerStyle, marginTop: '100px' }}>
          <div style={headerStyle}>
            <h1 style={titleStyle}>❌ Product Not Found</h1>
            <p style={subtitleStyle}>Unable to find the requested product.</p>
          </div>

          <div style={cardStyle}>
            <div style={errorMessageStyle}>
              <strong>Product ID:</strong> {router.query.productId}<br />
              <strong>Quantity:</strong> {router.query.quantity}
            </div>

            <div style={navigationStyle}>
              <Link href="/" style={navButtonStyle}>
                🏠 Return to Home
              </Link>
              <Link href="/test-checkout" style={testButtonStyle}>
                🧪 Test Checkout
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  const quantity = parseInt(router.query.quantity as string) || 1;

  return (
    <>
      {/* Navbar */}
      <nav style={{
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '1rem 0',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <div style={{ marginRight: '12px' }}>
                <Image
                  src="/images/logo.png"
                  alt="BeerHub Logo"
                  width={40}
                  height={40}
                />
              </div>
              <span style={{
                background: 'linear-gradient(90deg, #FFD600 0%, #FF8C42 50%, #FF3C38 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: '700',
                letterSpacing: '2px',
                fontSize: '24px'
              }}>
                BeerHub
              </span>
            </Link>

            <div style={{ display: 'flex', gap: '20px' }}>
              <Link href="/" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                Home
              </Link>
              <a href="#categories" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                Categories
              </a>
              <Link href="/admin/orders" style={{ color: '#333', textDecoration: 'none', fontWeight: '500' }}>
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div style={{ ...containerStyle, marginTop: '100px' }}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>🍺 Beer Checkout</h1>
          <p style={subtitleStyle}>Complete your order securely</p>
        </div>

        {/* Order Summary */}
        <div style={orderSummaryStyle}>
          <h2 style={{ marginBottom: '10px', color: '#1a1a1a', fontSize: 'clamp(20px, 4vw, 24px)' }}>
            📋 Order Summary
          </h2>

          <div style={orderSummaryCardStyle}>
            <div style={productInfoStyle}>
              <div style={productNameStyle}>{product.name}</div>
              <div style={priceStyle}>¥{product.price.toLocaleString()} each</div>
              <div style={priceStyle}>Quantity: {quantity}</div>
            </div>

            <div style={totalStyle}>
              Total: ¥{total.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div style={cardStyle}>
          <div style={paymentMethodStyle}>
            <h3 style={{ marginBottom: '20px', textAlign: 'center', color: '#1a1a1a' }}>
              💳 Payment Form
            </h3>

            {/* Payment Forms */}
            <StripePayment
              amount={total}
              productId={product.id}
              quantity={quantity}
              productName={product.name}
              onSuccess={() => {
                alert('Payment successful!');
                router.push(`/checkout?productId=${product.id}&quantity=${quantity}&method=card`);
              }}
              onError={(error) => {
                alert('Payment failed: ' + error);
              }}
            />
          </div>
        </div>

        {/* Navigation */}

      </div>
    </>
  );
}