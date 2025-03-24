import express from 'express';
import { 
  createBooking, 
  getBookingsByTenant, 
  getBookingsByOwner, 
  updateBookingStatus,
  getBookingsByListing,
  deleteBooking,
  testEmail
} from '../controllers/booking.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post('/create', verifyToken, createBooking);
router.get('/tenant/:id', verifyToken, getBookingsByTenant);
router.get('/owner/:id', verifyToken, getBookingsByOwner);
router.put('/status/:id', verifyToken, updateBookingStatus);
router.get('/listing/:id', verifyToken, getBookingsByListing);
router.delete('/:id', verifyToken, deleteBooking);
router.post('/test-email', testEmail); // Test route without token verification for testing

export default router;