import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import Layout from '../../components/Layout';
import ProductReviews from '../../components/ProductReviews';
import { getAllProducts, getProductById, Product } from '../../lib/products';
import { beerSpecs } from '../../lib/beer-specs';

interface ProductPageProps {
  product: Product;
}

const MAX_QTY = 24;

export default function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);

  if (router.isFallback) {
    return (
      <Layout>
        <div className="container" style={{ padding: '5rem 0', display: 'grid', placeItems: 'center' }}>
          <div className="spinner" role="status" aria-label="Loading" />
        </div>
      </Layout>
    );
  }

  const specs = beerSpecs(product.name);
  const total = product.price * quantity;
  const setQty = (n: number) => setQuantity(Math.min(MAX_QTY, Math.max(1, Number.isFinite(n) ? Math.round(n) : 1)));

  return (
    <Layout title={`${product.name} - BeerHub`}>
      <div className="container">
        <div className="product-layout">
          <div className="product-photo brut">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt={product.name} />
          </div>

          <div className="product-info">
            <Link href="/#beers" className="back-link">
              ← All beers
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span className="chip" style={{ background: 'var(--beer)' }}>
                {specs.abv} ABV
              </span>
              <span className="chip" style={{ background: 'var(--sky)' }}>
                {specs.type}
              </span>
              <span className="chip" style={{ background: 'var(--mint)' }}>
                In stock
              </span>
            </div>
            <h1>{product.name}</h1>
            <p className="price" style={{ marginTop: '0.75rem' }}>
              ¥{product.price.toLocaleString()}{' '}
              <span className="muted" style={{ fontSize: '1rem', fontWeight: 500 }}>
                per can or bottle
              </span>
            </p>
            <p className="muted" style={{ marginTop: '1rem', fontSize: '1.05rem' }}>
              {product.description}
            </p>

            <dl className="specs">
              <div>
                <dt>Alcohol</dt>
                <dd>{specs.abv}</dd>
              </div>
              <div>
                <dt>Style</dt>
                <dd>{specs.type}</dd>
              </div>
              <div>
                <dt>Brewed in</dt>
                <dd>{specs.origin}</dd>
              </div>
            </dl>

            <div className="buy-box brut-sm">
              <div className="buy-row">
                <div>
                  <label htmlFor="quantity" style={{ display: 'block', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Quantity
                  </label>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(quantity - 1)} disabled={quantity <= 1} aria-label="One fewer">
                      −
                    </button>
                    <input
                      id="quantity"
                      type="number"
                      inputMode="numeric"
                      min={1}
                      max={MAX_QTY}
                      value={quantity}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                    <button type="button" onClick={() => setQty(quantity + 1)} disabled={quantity >= MAX_QTY} aria-label="One more">
                      +
                    </button>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="muted" style={{ display: 'block', fontSize: '0.85rem' }}>
                    Total
                  </span>
                  <span className="price">¥{total.toLocaleString()}</span>
                </div>
              </div>
              <Link
                href={`/checkout?productId=${product.id}&quantity=${quantity}`}
                className="btn btn-lg btn-block bg-beer"
                style={{ marginTop: '1.25rem' }}
              >
                Go to checkout
              </Link>
              {quantity >= 6 && (
                <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                  Buying for a party? Up to {MAX_QTY} per order.
                </p>
              )}
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} productName={product.name} />
      </div>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const products = await getAllProducts();
  return {
    paths: products.map((p) => ({ params: { id: p.id.toString() } })),
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = parseInt(params?.id as string, 10);
  const product = Number.isFinite(id) ? await getProductById(id) : null;
  if (!product) return { notFound: true, revalidate: 60 };
  return { props: { product }, revalidate: 60 };
};
