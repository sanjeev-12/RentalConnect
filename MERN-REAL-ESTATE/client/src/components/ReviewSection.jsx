import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaStar } from 'react-icons/fa';

export default function ReviewSection({ listingId }) {
  const { currentUser } = useSelector(state => state.user);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [listingId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/review/listing/${listingId}`);
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      // Safely parse JSON
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Failed to parse server response');
      }
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch reviews');
      }
      
      setReviews(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message || 'An error occurred while fetching reviews');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/review/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          listingId,
          rating,
          comment
        })
      });
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      // Safely parse JSON
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Failed to parse server response');
      }
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }
      
      setReviews([...reviews, data]);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message || 'An error occurred while submitting your review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold mb-4">Reviews</h2>
      
      {/* Review Form */}
      {currentUser && (
        <form onSubmit={handleSubmitReview} className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
          
          {/* Star Rating */}
          <div className="flex mb-4">
            {[...Array(5)].map((_, index) => {
              const ratingValue = index + 1;
              return (
                <label key={index} className="cursor-pointer">
                  <input
                    type="radio"
                    name="rating"
                    className="hidden"
                    value={ratingValue}
                    onClick={() => setRating(ratingValue)}
                  />
                  <FaStar
                    className="mr-1"
                    size={24}
                    color={ratingValue <= (hover || rating) ? "#ffc107" : "#e4e5e9"}
                    onMouseEnter={() => setHover(ratingValue)}
                    onMouseLeave={() => setHover(null)}
                  />
                </label>
              );
            })}
          </div>

          {/* Comment Input */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="4"
            required
            minLength="10"
            maxLength="1000"
          />

          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review._id} className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center mb-2">
              <img
                src={review.userId.avatar || '/default-avatar.png'}
                alt={review.userId.username}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="font-medium">{review.userId.username}</p>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, index) => (
                    <FaStar
                      key={index}
                      size={16}
                      color={index < review.rating ? "#ffc107" : "#e4e5e9"}
                    />
                  ))}
                </div>
              </div>
              <span className="ml-auto text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-600">{review.comment}</p>
          </div>
        ))}
        
        {reviews.length === 0 && (
          <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
}
