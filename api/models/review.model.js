import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    minlength: 10,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent multiple reviews from same user for same listing
reviewSchema.index({ listingId: 1, userId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
