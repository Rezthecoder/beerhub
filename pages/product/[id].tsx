import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ProductReviews from '../../components/ProductReviews';
import { getAllProducts, getProductById, Product } from '../../lib/products';

interface ProductPageProps {
  product: Product;
}

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('Adding to cart:', { productId: product.id, quantity });

    try {
      // Navigate directly to checkout page with product and quantity
      await router.push(`/checkout?productId=${product.id}&quantity=${quantity}`);
    } catch (error) {
      console.error('Navigation error:', error);
      alert('Error navigating to checkout. Please try again.');
    }
  };

  if (router.isFallback) {
    return <Layout><div>Loading...</div></Layout>;
  }

  const getBeerSpecs = (name: string) => {
    if (name.includes('Sapporo')) return { abv: '5.0%', type: 'Premium Lager', origin: 'Hokkaido' };
    if (name.includes('Asahi')) return { abv: '5.0%', type: 'Super Dry Lager', origin: 'Tokyo' };
    if (name.includes('Honkirin')) return { abv: '6.0%', type: 'Strong Lager', origin: 'Tokyo' };
    if (name.includes('Nodogoshi')) return { abv: '5.0%', type: 'Light Lager', origin: 'Tokyo' };
    return { abv: '5.0%', type: 'Premium Beer', origin: 'Japan' };
  };

  const specs = getBeerSpecs(product.name);

  return (
    <Layout title={`${product.name} - BeerHub`}>
      <div className="container py-3 py-md-5">
        <div className="row g-4">
          {/* Product Image - Full Size */}
          <div className="col-12 col-md-6">
            <div className="position-relative">
              <img
                src={product.image}
                className="img-fluid rounded shadow"
                alt={product.name}
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  maxHeight: '600px',
                  backgroundColor: '#FFF8E1'
                }}
              />
              <div className="position-absolute top-0 end-0 m-2 m-md-3">
                <span className="badge" style={{
                  backgroundColor: '#FFD600',
                  color: '#000000',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  padding: '0.5rem 1rem'
                }}>
                  {specs.abv} ABV
                </span>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="col-12 col-md-6">
            <div className="mb-3">
              <span className="badge mb-2 me-2" style={{
                backgroundColor: '#6c757d',
                color: '#ffffff',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem'
              }}>
                {specs.type}
              </span>
              <span className="badge" style={{
                backgroundColor: '#17a2b8',
                color: '#ffffff',
                fontSize: '0.9rem',
                padding: '0.5rem 1rem'
              }}>
                📍 {specs.origin}
              </span>
            </div>

            <h1 className="mb-3 fw-bold" style={{
              fontSize: '2.5rem',
              color: '#FF4500',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {product.name}
            </h1>

            <p className="mb-4" style={{
              fontSize: '1.1rem',
              color: '#333333',
              lineHeight: '1.6'
            }}>
              {product.description}
            </p>

            <div className="mb-4">
              <div className="d-flex align-items-baseline flex-wrap">
                <span className="h1 fw-bold" style={{
                  color: '#FF4500',
                  fontSize: '3rem'
                }}>
                  ¥{product.price.toLocaleString()}
                </span>
                <span style={{
                  color: '#666666',
                  fontSize: '1.1rem',
                  marginLeft: '0.5rem'
                }}>
                  per unit
                </span>
              </div>
              {quantity > 1 && (
                <div className="mt-2">
                  <span className="h4" style={{ color: '#28a745' }}>
                    Total: ¥{(product.price * quantity).toLocaleString()}
                  </span>
                  <small style={{
                    color: '#666666',
                    display: 'block'
                  }}>
                    {quantity} × ¥{product.price.toLocaleString()} = ¥{(product.price * quantity).toLocaleString()}
                  </small>
                </div>
              )}
            </div>

            <form onSubmit={handleCheckout} className="mb-4">
              <div className="mb-3">
                <label htmlFor="quantity" className="form-label fw-bold" style={{
                  color: '#333333',
                  fontSize: '1.1rem'
                }}>
                  Quantity
                </label>
                <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                  <button
                    type="button"
                    className="btn"
                    style={{
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      border: 'none',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%'
                    }}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    name="quantity"
                    id="quantity"
                    className="form-control mx-2 text-center"
                    style={{
                      width: '80px',
                      height: '40px',
                      fontSize: '1.1rem',
                      border: '2px solid #FFD600',
                      borderRadius: '8px'
                    }}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                    min="1"
                    max="24"
                  />
                  <button
                    type="button"
                    className="btn"
                    style={{
                      backgroundColor: '#6c757d',
                      color: '#ffffff',
                      border: 'none',
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%'
                    }}
                    onClick={() => setQuantity(Math.min(24, quantity + 1))}
                    disabled={quantity >= 24}
                  >
                    +
                  </button>
                </div>
                <small style={{
                  color: '#666666',
                  display: 'block',
                  textAlign: 'center',
                  marginTop: '0.5rem'
                }}>
                  {quantity > 6 && (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>🎉 Bulk discount available! </span>
                  )}
                  Maximum 24 units per order
                </small>
              </div>

              <div className="d-grid gap-2">
                <button type="submit" className="btn btn-lg fw-bold py-3" style={{
                  backgroundColor: '#FF8C42',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.1rem'
                }}>
                  🛒 Add to Cart & Checkout
                </button>
                <Link
                  href={`/checkout?productId=${product.id}&quantity=${quantity}`}
                  className="btn btn-lg fw-bold py-3"
                  style={{
                    backgroundColor: 'transparent',
                    color: '#FF8C42',
                    border: '2px solid #FF8C42',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    textDecoration: 'none'
                  }}
                >
                  🛒 Direct Checkout
                </Link>
                <small style={{
                  textAlign: 'center',
                  color: '#28a745',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}>
                  ✓ Free delivery on orders over ¥2,000
                </small>
              </div>
            </form>

            <div className="border-top pt-4" style={{ borderTopColor: '#FFD600 !important' }}>
              <h5 className="fw-bold mb-3" style={{
                color: '#FF4500',
                fontSize: '1.3rem'
              }}>
                🍺 Beer Information
              </h5>
              <div className="row g-3">
                <div className="col-12 col-sm-6">
                  <ul className="list-unstyled">
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333333' }}>Type:</strong>
                      <span style={{ color: '#666666', marginLeft: '0.5rem' }}>{specs.type}</span>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333333' }}>ABV:</strong>
                      <span style={{ color: '#666666', marginLeft: '0.5rem' }}>{specs.abv}</span>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333333' }}>Origin:</strong>
                      <span style={{ color: '#666666', marginLeft: '0.5rem' }}>{specs.origin}</span>
                    </li>
                  </ul>
                </div>
                <div className="col-12 col-sm-6">
                  <ul className="list-unstyled">
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333333' }}>Delivery:</strong>
                      <span style={{ color: '#666666', marginLeft: '0.5rem' }}>Same day available</span>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333333' }}>Storage:</strong>
                      <span style={{ color: '#666666', marginLeft: '0.5rem' }}>Keep refrigerated</span>
                    </li>
                    <li style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ color: '#333333' }}>Age:</strong>
                      <span style={{ color: '#666666', marginLeft: '0.5rem' }}>20+ years required</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getAllProducts();
  const paths = products.map((product) => ({
    params: { id: product.id.toString() },
  }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = parseInt(params?.id as string);
  const product = await getProductById(id);

  if (!product) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product,
    },
    revalidate: 60,
  };
};