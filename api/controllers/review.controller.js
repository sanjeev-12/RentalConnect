import Review from '../models/review.model.js';
import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

// Create a review
export const createReview = async (req, res, next) => {
  try {
    const { listingId, rating, comment } = req.body;
    const userId = req.user.id;

    // Check if user has already reviewed this listing
    const existingReview = await Review.findOne({ listingId, userId });
    if (existingReview) {
      return next(errorHandler(400, 'You have already reviewed this property'));
    }

    const review = await Review.create({
      listingId,
      userId,
      rating,
      comment
    });

    // Update listing's average rating
    const reviews = await Review.find({ listingId });
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    await Listing.findByIdAndUpdate(listingId, { rating: avgRating });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// Get reviews for a listing
export const getListingReviews = async (req, res, next) => {
  try {
    const { listingId } = req.params;
    const reviews = await Review.find({ listingId })
      .populate('userId', 'username avatar')
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

// Update a review
export const updateReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(errorHandler(404, 'Review not found'));
    }
    if (review.userId.toString() !== req.user.id) {
      return next(errorHandler(401, 'You can only update your own reviews'));
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          rating: req.body.rating,
          comment: req.body.comment
        }
      },
      { new: true }
    );

    // Update listing's average rating
    const reviews = await Review.find({ listingId: review.listingId });
    const avgRating = reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length;
    await Listing.findByIdAndUpdate(review.listingId, { rating: avgRating });

    res.status(200).json(updatedReview);
  } catch (error) {
    next(error);
  }
};

// Delete a review
export const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return next(errorHandler(404, 'Review not found'));
    }
    if (review.userId.toString() !== req.user.id) {
      return next(errorHandler(401, 'You can only delete your own reviews'));
    }

    await Review.findByIdAndDelete(req.params.id);

    // Update listing's average rating
    const reviews = await Review.find({ listingId: review.listingId });
    const avgRating = reviews.length > 0 
      ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length
      : 0;
    await Listing.findByIdAndUpdate(review.listingId, { rating: avgRating });

    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
