import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import { getAllUsers, getAllListings, getAllBookings, updateUser, deleteUser, getDashboardStats } from '../controllers/admin.controller.js';

const router = express.Router();

// Admin middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin role required.' });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Apply verifyToken and isAdmin middleware to all admin routes
router.use(verifyToken, isAdmin);

// Admin routes
router.get('/users', getAllUsers);
router.get('/listings', getAllListings);
router.get('/bookings', getAllBookings);
router.get('/stats', getDashboardStats);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
