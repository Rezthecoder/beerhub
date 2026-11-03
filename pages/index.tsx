import Link from 'next/link';
import Layout from '../components/Layout';
import Sparkle from '../components/Sparkle';
import { getAllProducts } from '../lib/products';
import type { Product } from '../lib/products';
import { beerSpecs } from '../lib/beer-specs';

interface HomeProps {
  products: Product[];
}

const FEATURES = [
  { icon: '/images/truck.png', bg: 'bg-peach', title: 'Fast delivery', body: 'Same-day delivery in the Tokyo area.' },
  { icon: '/images/ice.png', bg: 'bg-sky', title: 'Ice cold', body: 'Kept cold all the way to your door.' },
  { icon: '/images/quality.png', bg: 'bg-mint', title: 'Authentic', body: 'Only real Japanese brewery beers.' },
  { icon: '/images/creditcard.png', bg: 'bg-coral-soft', title: 'Pay your way', body: 'PayPay, card or cash on delivery.' },
];

const STEPS = [
  { title: 'Pick a beer', body: 'Choose a beer and how many you want.' },
  { title: 'Choose how to pay', body: 'Card, PayPay or cash on delivery.' },
  { title: 'Pay', body: 'Use the test card or the PayPay sandbox. No real money moves.' },
  { title: 'Get your receipt', body: 'See your order and download a PDF receipt.' },
];

export default function Home({ products }: HomeProps) {
  const heroCans = products.slice(0, 3);

  return (
    <Layout title="BeerHub - Japanese beer delivery (demo)">
      <section className="hero">
        <div className="container" style={{ position: 'relative' }}>
          <Sparkle style={{ left: '-0.75rem', bottom: '-1.5rem', width: '4.5rem' }} />
          <Sparkle fill="#e9525c" style={{ right: '-0.5rem', top: '-1.25rem', width: '3rem' }} />
          <div className="hero-card brut">
            <div>
              <h1 className="hero-title">
                Toriaezu
                <br />
                生ビール
              </h1>
              <p className="hero-sub">
                Japan&apos;s favourite beers, delivered ice cold. Kirin, Sapporo and more, paid with PayPay, card or cash.
              </p>
              <div className="hero-actions">
                <a href="#beers" className="btn btn-lg bg-beer">
                  Shop the beers
                </a>
                <a href="#how" className="btn btn-lg">
                  How it works
                </a>
              </div>
              <div className="hero-chips">
                <span className="chip">🍺 {products.length} Japanese beers</span>
                <span className="chip">PayPay ready</span>
                <span className="chip">Save water, drink beer</span>
              </div>
            </div>
            <div className="hero-cans" aria-hidden="true">
              {heroCans.map((p) => (
                <div key={p.id} className="can brut-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="beers" className="section band">
        <div className="container">
          <h2 className="section-title">Featured Japanese beers</h2>
          <p className="section-intro">A small, hand-picked range from Japan&apos;s best-known breweries.</p>

          <ul className="product-grid" style={{ listStyle: 'none', padding: 0 }}>
            {products.map((product) => {
              const specs = beerSpecs(product.name);
              return (
                <li key={product.id} className="product-card brut">
                  <Link href={`/product/${product.id}`} className="photo" aria-label={product.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={product.image} alt="" loading="lazy" />
                    <span className="chip">{specs.abv} ABV</span>
                  </Link>
                  <div className="body">
                    <span className="chip" style={{ alignSelf: 'flex-start', background: 'var(--sky)' }}>
                      {specs.type}
                    </span>
                    <h3>{product.name}</h3>
                    <p className="desc">{product.description}</p>
                    <div className="foot">
                      <div>
                        <span className="price">¥{product.price.toLocaleString()}</span>
                        <span className="muted" style={{ display: 'block', fontSize: '0.8rem' }}>
                          per can or bottle
                        </span>
                      </div>
                      <Link href={`/product/${product.id}`} className="btn bg-beer">
                        View beer
                      </Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Why BeerHub</h2>
          <ul className="features" style={{ listStyle: 'none', padding: 0 }}>
            {FEATURES.map((f) => (
              <li key={f.title} className="feature brut-sm">
                <span className={`icon-box ${f.bg}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.icon} alt="" />
                </span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="how" className="section band" style={{ background: 'var(--sky)' }}>
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <ol className="features" style={{ listStyle: 'none', padding: 0 }}>
            {STEPS.map((s, i) => (
              <li key={s.title} className="feature brut-sm">
                <span className="icon-box bg-beer" style={{ fontWeight: 800, fontSize: '1.25rem' }}>
                  {i + 1}
                </span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </Layout>
  );
}

export async function getStaticProps() {
  const products = await getAllProducts();
  return {
    props: { products },
    revalidate: 60,
  };
}
