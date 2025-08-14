import { getProductById } from '../../../lib/products';
import Link from 'next/link';
import Image from 'next/image';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const productId = parseInt(params.id);
  const product = await getProductById(productId);

  if (!product) {
    return (
      <div className="container py-3 py-md-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-6 text-center">
            <div className="card shadow">
              <div className="card-body py-4 py-md-5 px-3 px-md-4">
                <div className="text-warning mb-3" style={{ fontSize: 'min(4rem, 15vw)' }}>
                  ⚠️
                </div>
                <h2 className="text-warning mb-3 fs-3 fs-md-2">Product Not Found</h2>
                <p className="text-muted mb-4">The product you're looking for doesn't exist.</p>
                <Link href="/" className="btn btn-primary py-2 py-md-3">
                  Return to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3 py-md-5">
      <div className="row">
        {/* Product Image */}
        <div className="col-12 col-md-6 mb-4">
          <div className="product-image-container position-relative" style={{
            height: '400px',
            backgroundColor: '#f8f9fa',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="product-image"
              style={{
                objectFit: 'contain',
                maxHeight: '100%'
              }}
            />
          </div>
        </div>

        {/* Product Details */}
        <div className="col-12 col-md-6">
          <div className="product-details">
            <h1 className="product-name mb-3 fs-2 fs-md-1" style={{
              background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontWeight: 'bold'
            }}>
              {product.name}
            </h1>

            <div className="product-price mb-4">
              <span className="price-display fs-1 fw-bold" style={{ color: '#dc3545' }}>
                ¥{product.price.toLocaleString()}
              </span>
            </div>

            <div className="product-description mb-4">
              <p className="text-muted fs-5" style={{ color: '#6c757d', lineHeight: '1.6' }}>
                {product.description}
              </p>
            </div>

            {/* Beer Information */}
            <div className="beer-info mb-4 p-4 rounded" style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7'
            }}>
              <h4 className="mb-3" style={{ color: '#856404' }}>🍺 Beer Information</h4>
              <div className="row">
                <div className="col-6">
                  <div className="info-item mb-2">
                    <strong style={{ color: '#856404' }}>Alcohol Content:</strong>
                    <span className="ms-2" style={{ color: '#495057' }}>5-6%</span>
                  </div>
                  <div className="info-item mb-2">
                    <strong style={{ color: '#856404' }}>Style:</strong>
                    <span className="ms-2" style={{ color: '#495057' }}>Japanese Lager</span>
                  </div>
                </div>
                <div className="col-6">
                  <div className="info-item mb-2">
                    <strong style={{ color: '#856404' }}>Origin:</strong>
                    <span className="ms-2" style={{ color: '#495057' }}>Japan</span>
                  </div>
                  <div className="info-item mb-2">
                    <strong style={{ color: '#856404' }}>Temperature:</strong>
                    <span className="ms-2" style={{ color: '#495057' }}>4-6°C</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Selection */}
            <div className="quantity-selection mb-4">
              <label htmlFor="quantity" className="form-label fw-bold" style={{ color: '#495057' }}>
                Quantity:
              </label>
              <div className="d-flex align-items-center">
                <button
                  className="btn btn-outline-secondary me-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid #6c757d'
                  }}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  className="form-control text-center mx-2"
                  value="1"
                  min="1"
                  max="10"
                  style={{
                    width: '80px',
                    border: '2px solid #6c757d',
                    borderRadius: '8px'
                  }}
                />
                <button
                  className="btn btn-outline-secondary ms-2"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid #6c757d'
                  }}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons d-grid gap-3">
              <Link
                href={`/checkout?productId=${product.id}&quantity=1`}
                className="btn btn-primary btn-lg py-3 fw-bold"
                style={{
                  backgroundColor: '#dc3545',
                  borderColor: '#dc3545',
                  fontSize: '18px'
                }}
              >
                🛒 Add to Cart & Checkout
              </Link>

              <Link
                href="/"
                className="btn btn-outline-secondary py-2"
              >
                ← Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
