import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { 
  createReview, 
  getListingReviews, 
  updateReview, 
  deleteReview 
} from '../controllers/review.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create a new review
router.post('/create', createReview);

// Get all reviews for a listing
router.get('/listing/:listingId', getListingReviews);

// Update a review
router.put('/:id', updateReview);

// Delete a review
router.delete('/:id', deleteReview);

export default router;
