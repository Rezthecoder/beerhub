import Layout from '../components/Layout';
import Link from 'next/link';
import { getAllProducts } from '../lib/products';
import type { Product } from '../lib/products';

interface HomeProps {
  products: Product[];
}

export default function Home({ products }: HomeProps) {
  const getBeerCategory = (name: string) => {
    if (name.includes('Sapporo')) return 'Premium Lager';
    if (name.includes('Asahi')) return 'Super Dry';
    if (name.includes('Kirin')) return 'Classic Beer';
    return 'Craft Beer';
  };

  const getAlcoholContent = (name: string) => {
    if (name.includes('Honkirin')) return '6.0%';
    if (name.includes('Nodogoshi')) return '5.0%';
    return '5.0%';
  };

  return (
    <Layout title="BeerHub - Premium Japanese Beer Delivery">
      {/* Hero Section */}
      <div className="hero-section py-5" style={{
        position: 'relative',
        color: '#FFD600'
      }}>
        <div className="container text-center">
          <h1 className="display-2 fw-bold mb-3" style={{ color: '#FF0000', textShadow: '0 2px 8px #fffbe6' }}>Toriaezu 生ビール</h1>
          <p className="display-6  mb-3" style={{ color: '#ffa500' }}>Save Water, Drink Beer</p>
        </div>
      </div>

      {/* Featured Beers */}
      <div className="container py-5">
        <div className="text-center mb-5">
          <h2 className="display-5 fw-bold" style={{ color: '#FFD600' }}>Featured Japanese Beers</h2>
          <p className="lead" style={{ color: '#FFEB99' }}>Handpicked selection of Japan's finest brews</p>
        </div>

        <div className="row">
          {products.map(product => (
            <div key={product.id} className="col-lg-4 col-md-6 mb-4">
              <div className="card h-100 shadow-sm border-0 beer-card" style={{ backgroundColor: '#FFF8E1' }}>
                <div className="position-relative">
                  <img
                    src={product.image}
                    className="card-img-top product-image"
                    alt={product.name}
                    style={{ height: '280px', objectFit: 'cover', background: '#FFFDE7' }}
                  />
                  <div className="position-absolute top-0 end-0 m-2">
                    <span className="badge" style={{ backgroundColor: '#FFD600', color: '#7c5a00', fontWeight: 700 }}>{getAlcoholContent(product.name)} ALC</span>
                  </div>
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="mb-2 text-center">
                    <span className="badge mb-2" style={{ backgroundColor: '#FFD600', color: '#000000', fontWeight: 700 }}>
                      {getBeerCategory(product.name)}
                    </span>
                  </div>
                  <p className="card-title text-center" style={{
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #FFD600 0%, #FF8C42 50%, #FF4500 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: '2.2rem',
                    textShadow: 'none'
                  }}>
                    {product.name}
                  </p>
                  <p className="card-text flex-grow-1 small" style={{ color: '#333333', fontWeight: 500 }}>{product.description}</p>

                  <div className="mt-auto">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <span className="h2 fw-bold mb-0" style={{ color: '#FF4500', fontSize: '2.5rem' }}>¥{product.price.toLocaleString()}</span>
                        <small className="d-block" style={{ color: '#666666', fontWeight: 600 }}>per can/bottle</small>
                      </div>
                      <div className="text-end">
                        <small style={{ color: '#28a745', fontWeight: 600 }}>✓ In Stock</small>
                      </div>
                    </div>
                    <Link href={`/product/${product.id}`} className="btn w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                      style={{
                        backgroundColor: '#FFD600',
                        color: '#7c5a00',
                        border: 'none',
                        fontWeight: 700
                      }}>
                      <img src="/images/cart.png" alt="Cart" style={{ width: '3rem', height: '3rem' }} />
                      Add to Cart
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="pt-5 pb-0" style={{
        backgroundColor: '#2d1b0e',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px'
      }}>
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3 mb-4">
              <div className="feature-icon mb-3">
                <img src="/images/truck.png" alt="Fast Delivery" style={{ width: '3rem', height: '3rem' }} />
              </div>
              <h5 style={{ color: '#ffffff' }}>Fast Delivery</h5>
              <p style={{ color: '#FFD600' }}>Same-day delivery available in Tokyo area</p>
            </div>
            <div className="col-md-3 mb-4">
              <div className="feature-icon mb-3">
                <img src="/images/ice.png" alt="Ice Cold" style={{ width: '3rem', height: '3rem' }} />
              </div>
              <h5 style={{ color: '#ffffff' }}>Ice Cold</h5>
              <p style={{ color: '#FFD600' }}>Temperature controlled delivery guaranteed</p>
            </div>
            <div className="col-md-3 mb-4">
              <div className="feature-icon mb-3">
                <img src="/images/quality.png" alt="Premium Quality" style={{ width: '3rem', height: '3rem' }} />
              </div>
              <h5 style={{ color: '#ffffff' }}>Premium Quality</h5>
              <p style={{ color: '#FFD600' }}>Only authentic Japanese brewery products</p>
            </div>
            <div className="col-md-3 mb-4">
              <div className="feature-icon mb-3">
                <img src="/images/creditcard.png" alt="Easy Payment" style={{ width: '3rem', height: '3rem' }} />
              </div>
              <h5 style={{ color: '#ffffff' }}>Easy Payment</h5>
              <p style={{ color: '#FFD600' }}>PayPay, Credit Card, or Cash on Delivery</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  const products = await getAllProducts();

  return {
    props: {
      products,
    },
    revalidate: 60, // Revalidate every 60 seconds
  };
}