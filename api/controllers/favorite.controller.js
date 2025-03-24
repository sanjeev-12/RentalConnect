import Listing from "../models/listing.model.js";
import User from "../models/user.model.js";

export const addFavorite = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if listing is already in favorites
    if (user.favorites.includes(listingId)) {
      return res.status(400).json({ success: false, message: 'Listing is already in favorites' });
    }

    // Add listing to user's favorites
    user.favorites.push(listingId);
    await user.save();

    res.status(200).json({ success: true, message: 'Listing added to favorites' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove listing from user's favorites
    user.favorites = user.favorites.filter(id => id.toString() !== listingId);
    await user.save();

    res.status(200).json({ success: true, message: 'Listing removed from favorites' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const addSavedProperty = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;

    // Check if listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: 'Listing not found' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if listing is already saved
    if (user.savedProperties.includes(listingId)) {
      return res.status(400).json({ success: false, message: 'Listing is already saved' });
    }

    // Add listing to user's saved properties
    user.savedProperties.push(listingId);
    await user.save();

    res.status(200).json({ success: true, message: 'Listing added to saved properties' });
  } catch (error) {
    console.error('Error adding saved property:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const removeSavedProperty = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { userId } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove listing from user's saved properties
    user.savedProperties = user.savedProperties.filter(id => id.toString() !== listingId);
    await user.save();

    res.status(200).json({ success: true, message: 'Listing removed from saved properties' });
  } catch (error) {
    console.error('Error removing saved property:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
