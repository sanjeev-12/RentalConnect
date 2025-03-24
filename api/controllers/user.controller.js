import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";
 // Ensure you have this model
import { errorHandler } from "../utils/error.js";
import bcryptjs from "bcryptjs";

// Test API route
export const testing = (req, res) => {
  res.json({ message: "Every programmer is an Author!" });
};

// Update user details
export const updateUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can only update your own account!"));
  }

  try {
    if (req.body.password) {
      req.body.password = bcryptjs.hashSync(req.body.password, 10);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedUser) return next(errorHandler(404, "User not found"));

    const { password, ...rest } = updatedUser._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// Delete user
export const deleteUser = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can only delete your own account!"));
  }

  try {
    await User.findByIdAndDelete(req.params.id);
    res.clearCookie("access_token");
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get user listings
export const getUserListing = async (req, res, next) => {
  if (req.user.id !== req.params.id) {
    return next(errorHandler(401, "You can only view your own listings!"));
  }

  try {
    const listings = await Listing.find({ userRef: req.params.id });
    res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};

// Get user details
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, "User Not Found"));

    const { password, ...rest } = user._doc;
    res.status(200).json(rest);
  } catch (error) {
    next(error);
  }
};

// Get bookings for a user (Fixed Query)
export const getBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ userRef: req.params.id });

    if (!bookings.length) return next(errorHandler(404, "No bookings found"));

    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// Add a favorite listing
export const addFavorite = async (req, res, next) => {
  const { userId, listingId, listing } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, "User not found"));

    // Add to favorites array if it doesn't exist
    if (!user.favorites) {
      user.favorites = [];
    }

    // Check if listing is already in favorites
    if (!user.favorites.some(fav => fav._id.toString() === listingId)) {
      user.favorites.push(listing);
      await user.save();
    }

    res.status(200).json({ success: true, favorites: user.favorites });
  } catch (error) {
    next(error);
  }
};

// Add a booking
export const addBooking = async (req, res, next) => {
  const { userId, listingId, listing } = req.body;
  
  try {
    const user = await User.findById(userId);
    if (!user) return next(errorHandler(404, "User not found"));

    // Add to bookings array if it doesn't exist
    if (!user.bookings) {
      user.bookings = [];
    }

    // Check if listing is already in bookings
    if (!user.bookings.some(book => book._id.toString() === listingId)) {
      user.bookings.push(listing);
      await user.save();
    }

    res.status(200).json({ success: true, bookings: user.bookings });
  } catch (error) {
    next(error);
  }
};

// Get user's favorites
export const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, "User not found"));

    res.status(200).json(user.favorites || []);
  } catch (error) {
    next(error);
  }
};

// Get user's bookings
export const getUserBookings = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(errorHandler(404, "User not found"));

    res.status(200).json(user.bookings || []);
  } catch (error) {
    next(error);
  }
};

// Export all functions properly
// export {
//   testing,
//   updateUser,
//   deleteUser,
//   getUserListing,
//   getUser,
//   getBookings,
// };
