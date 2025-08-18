import Link from 'next/link';
import styles from '../styles/checkout.module.css';

export default function TestCheckoutPage() {
    const testProducts = [
        { id: 1, name: "Asahi Super Dry", price: 350 },
        { id: 2, name: "Kirin Ichiban", price: 380 },
        { id: 3, name: "Sapporo Premium", price: 400 },
        { id: 4, name: "Nodogoshi", price: 320 },
        { id: 5, name: "Honkirin", price: 360 },
        { id: 6, name: "Nama Beer", price: 450 }
    ];

    return (
        <div className={styles.checkoutContainer}>
            <h1>🧪 Test Checkout Links</h1>
            <p>Click any link below to test the checkout with different products:</p>

            <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
                {testProducts.map((product) => (
                    <div key={product.id} style={{
                        border: '1px solid #e5e7eb',
                        padding: '1rem',
                        borderRadius: '8px',
                        background: 'white'
                    }}>
                        <h3>{product.name}</h3>
                        <p>Price: ¥{product.price.toLocaleString()}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <Link
                                href={`/checkout?productId=${product.id}&quantity=1`}
                                style={{
                                    background: '#3b82f6',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Buy 1
                            </Link>
                            <Link
                                href={`/checkout?productId=${product.id}&quantity=2`}
                                style={{
                                    background: '#10b981',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Buy 2
                            </Link>
                            <Link
                                href={`/checkout?productId=${product.id}&quantity=3`}
                                style={{
                                    background: '#f59e0b',
                                    color: 'white',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    textDecoration: 'none',
                                    fontSize: '0.875rem'
                                }}
                            >
                                Buy 3
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: '#f3f4f6', borderRadius: '8px' }}>
                <h3>🔍 Debug Info</h3>
                <p>If checkout still shows "Product Not Found", check:</p>
                <ul>
                    <li>Browser console for error messages</li>
                    <li>URL parameters are correct</li>
                    <li>Product ID exists in the mock data</li>
                </ul>
            </div>
        </div>
    );
}
