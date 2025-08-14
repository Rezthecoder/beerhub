import { useState } from 'react';

interface Review {
    id: number;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
    verified: boolean;
}

interface ProductReviewsProps {
    productId: number;
    productName: string;
}

export default function ProductReviews({ productId, productName }: ProductReviewsProps) {
    const [reviews, setReviews] = useState<Review[]>([
        {
            id: 1,
            customerName: "Takeshi M.",
            rating: 5,
            comment: "Excellent beer! Very refreshing and authentic taste. Fast delivery too.",
            date: "2025-01-20",
            verified: true
        },
        {
            id: 2,
            customerName: "Sarah K.",
            rating: 4,
            comment: "Good quality beer, exactly as expected. Will order again.",
            date: "2025-01-18",
            verified: true
        },
        {
            id: 3,
            customerName: "Hiroshi T.",
            rating: 5,
            comment: "Perfect for evening relaxation. Great packaging and arrived cold!",
            date: "2025-01-15",
            verified: false
        }
    ]);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [newReview, setNewReview] = useState({
        customerName: '',
        rating: 5,
        comment: ''
    });

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    const handleSubmitReview = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newReview.customerName.trim() || !newReview.comment.trim()) {
            alert('Please fill in all fields');
            return;
        }

        const review: Review = {
            id: Date.now(),
            customerName: newReview.customerName,
            rating: newReview.rating,
            comment: newReview.comment,
            date: new Date().toISOString().split('T')[0],
            verified: false
        };

        setReviews([review, ...reviews]);
        setNewReview({ customerName: '', rating: 5, comment: '' });
        setShowReviewForm(false);
    };

    const renderStars = (rating: number, interactive = false, onRatingChange?: (rating: number) => void) => {
        return (
            <div className="d-flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`${interactive ? 'cursor-pointer' : ''} ${star <= rating ? 'text-warning' : 'text-muted'
                            }`}
                        style={{ fontSize: '1.2rem', cursor: interactive ? 'pointer' : 'default' }}
                        onClick={() => interactive && onRatingChange && onRatingChange(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    return (
        <div className="mt-5">
            <div className="border-top pt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h5 className="fw-bold mb-2">Customer Reviews</h5>
                        <div className="d-flex align-items-center">
                            {renderStars(Math.round(averageRating))}
                            <span className="ms-2 fw-bold">{averageRating.toFixed(1)}</span>
                            <span className="text-muted ms-1">({reviews.length} reviews)</span>
                        </div>
                    </div>
                    <button
                        className="btn btn-outline-warning"
                        onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                        ✍️ Write Review
                    </button>
                </div>

                {/* Review Form */}
                {showReviewForm && (
                    <div className="card mb-4">
                        <div className="card-body">
                            <h6 className="card-title">Write a Review for {productName}</h6>
                            <form onSubmit={handleSubmitReview}>
                                <div className="mb-3">
                                    <label className="form-label">Your Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newReview.customerName}
                                        onChange={(e) => setNewReview({ ...newReview, customerName: e.target.value })}
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Rating</label>
                                    <div>
                                        {renderStars(newReview.rating, true, (rating) =>
                                            setNewReview({ ...newReview, rating })
                                        )}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Your Review</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                                        placeholder="Share your experience with this beer..."
                                        required
                                    />
                                </div>
                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-warning">
                                        Submit Review
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowReviewForm(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                <div className="reviews-list">
                    {reviews.map((review) => (
                        <div key={review.id} className="card mb-3">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                    <div>
                                        <div className="d-flex align-items-center">
                                            <strong className="me-2">{review.customerName}</strong>
                                            {review.verified && (
                                                <span className="badge bg-success text-white small">✓ Verified Purchase</span>
                                            )}
                                        </div>
                                        {renderStars(review.rating)}
                                    </div>
                                    <small className="text-muted">{review.date}</small>
                                </div>
                                <p className="mb-0">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {reviews.length === 0 && (
                    <div className="text-center py-4">
                        <p className="text-muted">No reviews yet. Be the first to review this beer!</p>
                    </div>
                )}
            </div>
        </div>
    );
}