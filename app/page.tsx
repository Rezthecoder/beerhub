import { getProducts } from '../lib/products'
import Link from 'next/link'
import Image from 'next/image'

export default async function HomePage() {
    const products = await getProducts()

    return (
        <div className="container py-3 py-md-5">
            {/* Hero Section */}
            <div className="hero-section text-center mb-5">
                <h1 className="display-4 fw-bold mb-3" style={{
                    background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    🍺 Premium Japanese Beer
                </h1>
                <p className="lead fs-4 mb-4" style={{ color: '#2E2E2E' }}>
                    Discover authentic Japanese brewing tradition delivered to your door
                </p>
                <div className="hero-buttons">
                    <Link href="#products" className="btn btn-primary btn-lg me-3 mb-2">
                        🛒 Shop Now
                    </Link>
                    <Link href="#about" className="btn btn-outline-primary btn-lg mb-2">
                        📖 Learn More
                    </Link>
                </div>
            </div>

            {/* Products Section */}
            <section id="products" className="mb-5">
                <h2 className="text-center mb-4 fs-2 fs-md-1" style={{ color: '#2E2E2E' }}>
                    🍻 Our Premium Beer Collection
                </h2>
                <div className="row g-4">
                    {products.map((product) => (
                        <div key={product.id} className="col-12 col-md-6 col-lg-4">
                            <div className="card h-100 shadow-sm border-0">
                                <div className="card-img-top position-relative" style={{ height: '250px', backgroundColor: '#f8f9fa' }}>
                                    <Image
                                        src={product.image}
                                        alt={product.name}
                                        fill
                                        className="card-img-top"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title fw-bold mb-2" style={{
                                        background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}>
                                        {product.name}
                                    </h5>
                                    <p className="card-text text-muted mb-3 flex-grow-1">
                                        {product.description}
                                    </p>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="fs-5 fw-bold text-danger">
                                            ¥{product.price.toLocaleString()}
                                        </span>
                                        <Link
                                            href={`/product/${product.id}`}
                                            className="btn btn-primary"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section id="about" className="mb-5">
                <div className="row g-4">
                    <div className="col-12 col-md-4 text-center">
                        <div className="feature-card p-4">
                            <div className="feature-icon mb-3">
                                <img src="/images/truck.png" alt="Fast Delivery" width="64" height="64" />
                            </div>
                            <h4 className="text-white mb-3">🚚 Fast Delivery</h4>
                            <p className="text-white-50 mb-0">
                                Same-day delivery in Tokyo, Osaka, and Kyoto areas
                            </p>
                        </div>
                    </div>
                    <div className="col-12 col-md-4 text-center">
                        <div className="feature-card p-4">
                            <div className="feature-icon mb-3">
                                <img src="/images/quality.png" alt="Premium Quality" width="64" height="64" />
                            </div>
                            <h4 className="text-white mb-3">⭐ Premium Quality</h4>
                            <p className="text-white-50 mb-0">
                                Authentic Japanese beer from renowned breweries
                            </p>
                        </div>
                    </div>
                    <div className="col-12 col-md-4 text-center">
                        <div className="feature-card p-4">
                            <div className="feature-icon mb-3">
                                <img src="/images/ice.png" alt="Cold Storage" width="64" height="64" />
                            </div>
                            <h4 className="text-white mb-3">❄️ Cold Storage</h4>
                            <p className="text-white-50 mb-0">
                                Temperature-controlled storage and delivery
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="text-center">
                <div className="cta-section p-5 rounded">
                    <h3 className="mb-3" style={{ color: '#2E2E2E' }}>
                        🎉 Ready to Experience Premium Japanese Beer?
                    </h3>
                    <p className="lead mb-4" style={{ color: '#555' }}>
                        Join thousands of satisfied customers enjoying authentic Japanese brewing tradition
                    </p>
                    <Link href="#products" className="btn btn-primary btn-lg">
                        🛒 Start Shopping Now
                    </Link>
                </div>
            </section>
        </div>
    )
}
