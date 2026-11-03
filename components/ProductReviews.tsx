import { useState } from 'react';

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductReviewsProps {
  productId: number;
  productName: string;
}

/** Example reviews written for the demo. They are labelled as samples on the page. */
const SAMPLE_REVIEWS: Review[] = [
  { id: 1, customerName: 'Sample review', rating: 5, comment: 'Refreshing, authentic taste and it arrived cold.', date: '2025-08-15' },
  { id: 2, customerName: 'Sample review', rating: 4, comment: 'Exactly as described. Easy to order with PayPay.', date: '2025-08-14' },
  { id: 3, customerName: 'Sample review', rating: 5, comment: 'Great with dinner. The checkout was quick.', date: '2025-08-12' },
];

function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? '' : 'off'} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

export default function ProductReviews({ productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>(SAMPLE_REVIEWS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: '', rating: 5, comment: '' });
  const [formError, setFormError] = useState('');

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName.trim() || !form.comment.trim()) {
      setFormError('Add your name and a comment.');
      return;
    }
    setReviews([
      {
        id: Date.now(),
        customerName: form.customerName.trim(),
        rating: form.rating,
        comment: form.comment.trim(),
        date: new Date().toISOString().split('T')[0],
      },
      ...reviews,
    ]);
    setForm({ customerName: '', rating: 5, comment: '' });
    setFormError('');
    setShowForm(false);
  };

  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <h2 id="reviews-title" className="section-title" style={{ fontSize: '2rem' }}>
            Reviews
          </h2>
          <p className="muted" style={{ marginTop: '0.4rem' }}>
            <Stars rating={Math.round(average)} /> {average.toFixed(1)} from {reviews.length} reviews. These are sample reviews
            for the demo; ones you add stay in this browser only.
          </p>
        </div>
        <button type="button" className="btn bg-peach" onClick={() => setShowForm((v) => !v)} aria-expanded={showForm}>
          {showForm ? 'Cancel' : 'Write a review'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="brut-sm bg-sand" style={{ marginTop: '1.5rem', padding: '1.5rem' }}>
          <div className="field">
            <label htmlFor="review-name">Your name</label>
            <input
              id="review-name"
              className="input"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
            />
          </div>
          <div className="field">
            <span className="label" id="review-rating">
              Rating
            </span>
            <div role="radiogroup" aria-labelledby="review-rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={form.rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  className={`star-button ${n <= form.rating ? 'on' : ''}`}
                  onClick={() => setForm({ ...form, rating: n })}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="review-comment">What did you think of {productName}?</label>
            <textarea
              id="review-comment"
              className="input"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
            />
          </div>
          {formError && (
            <p className="alert alert-error" style={{ marginTop: '1rem' }} role="alert">
              {formError}
            </p>
          )}
          <button type="submit" className="btn bg-beer" style={{ marginTop: '1.25rem' }}>
            Post review
          </button>
        </form>
      )}

      <ul className="review-list" style={{ listStyle: 'none', padding: 0 }}>
        {reviews.map((r) => (
          <li key={r.id} className="review brut-sm">
            <Stars rating={r.rating} />
            <p style={{ marginTop: '0.6rem', fontWeight: 600 }}>{r.comment}</p>
            <p className="muted" style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
              {r.customerName} · {r.date}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
