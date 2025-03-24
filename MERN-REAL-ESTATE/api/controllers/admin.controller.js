import User from '../models/user.model.js';
import Listing from '../models/listing.model.js';
import Booking from '../models/booking.model.js';
import { errorHandler } from '../utils/error.js';

// Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// Get all listings
export const getAllListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({})
      .select('name address regularPrice discountPrice type imageUrls userRef createdAt status bookedBy offer')
      .populate('userRef', 'username email')
      .sort({ createdAt: -1 });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// Get all bookings
export const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({})
      .populate('tenantId', 'username email')
      .populate('listingId', 'name address price')
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// Update user (including role)
export const updateUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(errorHandler(403, 'You cannot update your own account as admin'));
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return next(errorHandler(404, 'User not found'));
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return next(errorHandler(403, 'You cannot delete your own account as admin'));
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    // Delete all listings associated with the user
    await Listing.deleteMany({ userRef: req.params.id });
    
    // Delete all bookings associated with the user
    await Booking.deleteMany({ tenantId: req.params.id });

    res.status(200).json({ message: 'User and associated data deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOwners = await User.countDocuments({ role: 'owner' });
    const totalTenants = await User.countDocuments({ role: 'tenant' });
    const totalListings = await Listing.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });

    // Recent users (last 5)
    const recentUsers = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent listings (last 5)
    const recentListings = await Listing.find({})
      .select('name address regularPrice discountPrice type imageUrls userRef createdAt status bookedBy offer')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent bookings (last 5)
    const recentBookings = await Booking.find({})
      .populate('tenantId', 'username')
      .populate('listingId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      counts: {
        users: {
          total: totalUsers,
          owners: totalOwners,
          tenants: totalTenants
        },
        listings: totalListings,
        bookings: {
          total: totalBookings,
          pending: pendingBookings,
          approved: approvedBookings,
          rejected: rejectedBookings
        }
      },
      recent: {
        users: recentUsers,
        listings: recentListings,
        bookings: recentBookings
      }
    });
  } catch (error) {
    next(error);
  }
};
