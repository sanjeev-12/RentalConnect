import Listing from "../models/listing.model.js"
import { errorHandler } from "../utils/error.js"

export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body)
    return res.status(201).json(listing)
  } catch (error) {
    next(error)
  }
}

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if(!listing) {
    return next(errorHandler(404, 'Listing not found!'))
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings'))
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted successfully!');
  } catch (error) {
    next(error)
  }
}

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id)

  if(!listing) {
    return next(errorHandler(404, 'Listing Not Found!'))
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings'))
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      {new: true}
    );
    res.status(200).json(updatedListing)
  } catch (error) {
    next(error)
  }
}

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('bookedBy', 'username email');
    
    if(!listing) {
      return next(errorHandler(404, 'Listing not found'))
    }
    res.status(200).json(listing)
  } catch (error) {
    next(error)
  }
}

export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;
    const userRole = req.user?.role;
    const userId = req.user?.id;

    let offer = req.query.offer;
    if (offer === undefined || offer === 'false') {
      offer = {$in: [false, true]}
    }

    let furnished = req.query.furnished;
    if(furnished === undefined || furnished === 'false') {
      furnished = {$in: [false, true]}
    }

    let parking = req.query.parking;
    if(parking === undefined || parking === 'false') {
      parking = {$in: [false, true]}
    }

    let type = req.query.type;
    if(type === undefined || type === 'all') {
      type = {$in: ['sale', 'rent']}
    }

    const searchTerm = req.query.searchTerm || '';

    const sort = req.query.sort || 'createdAt';

    const order = req.query.order || 'desc';

    // Build user-role specific filters
    let userFilter = {};
    let statusFilter = {};

    // Role-specific filtering
    if (userRole === 'owner') {
      // Owners should only see their own listings
      userFilter = { userRef: userId };
    } else if (userRole === 'tenant') {
      // Tenants should only see available listings or ones they've booked
      statusFilter = { $or: [{ status: 'available' }, { bookedBy: userId }] };
    } else if (userRole === 'admin') {
      // Admin can see all listings, no additional filters needed
    } else {
      // Public/non-logged in users can only see available listings
      statusFilter = { status: 'available' };
    }

    // Override with query parameter if explicitly set
    if (req.query.includeBooked === 'true') {
      statusFilter = {};
    }

    const listings = await Listing.find({
      name: {$regex: searchTerm, $options: 'i'},
      offer,
      furnished,
      parking,
      type,
      ...userFilter,
      ...statusFilter
    })
    .sort({
      [sort]: order
    })
    .limit(limit)
    .skip(startIndex)
    .populate('bookedBy', 'username email');

    return res.status(200).json(listings)
    
  } catch (error) {
    next(error)
  }
}