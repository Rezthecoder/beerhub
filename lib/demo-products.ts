import type { Database } from './database.types';

type Product = Database['public']['Tables']['products']['Row'];

const SEEDED_AT = '2025-08-15T00:00:00.000Z';

/**
 * Built-in catalogue (same beers as scripts/insert-beer-products.js).
 * Shown only when the database can't be reached or has no products, so the demo
 * shop never appears empty. Real products from Supabase always take priority.
 */
export const DEMO_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Kirin Nodogoshi Beer',
    price: 280,
    image: '/images/nodogosi.jpg',
    description:
      'Refreshing Japanese beer with 5% alcohol content. Kirin\'s brewing technology creates the perfect "nodogoshi" (throat feel).',
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  },
  {
    id: 2,
    name: 'Sapporo Premium Beer',
    price: 320,
    image: '/images/sapporo.webp',
    description:
      'Premium Japanese lager beer from Sapporo Breweries. Crisp, clean taste with the iconic star logo since 1876.',
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  },
  {
    id: 3,
    name: 'Kirin Ichiban Shibori',
    price: 330,
    image: '/images/kirin.webp',
    description:
      "Premium beer made using only the first press of the wort. Pure taste from Japan's finest brewing techniques.",
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  },
  {
    id: 4,
    name: 'Kirin Honkirin Beer',
    price: 350,
    image: '/images/honkirin.webp',
    description:
      'Authentic Kirin beer with 6% alcohol content. Long-term low-temperature fermentation for rich, full-bodied taste.',
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  },
  {
    id: 5,
    name: 'Kirin Nama Beer',
    price: 310,
    image: '/images/nama.webp',
    description:
      'Fresh draft beer taste in a can. Unpasteurized for maximum flavor and authentic brewery experience.',
    created_at: SEEDED_AT,
    updated_at: SEEDED_AT,
  },
];
