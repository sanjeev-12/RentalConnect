import Booking from '../models/booking.model.js';
import { errorHandler } from '../utils/error.js';
import Listing from '../models/listing.model.js';
import User from '../models/user.model.js';
import emailService from '../utils/emailService.js';

export const createBooking = async (req, res, next) => {
  try {
    const { listingId, tenantId, tenantDetails } = req.body;

    // Validate required fields
    if (!listingId || !tenantId) {
      return res.status(400).json({ success: false, message: "Listing ID and Tenant ID are required" });
    }

    // Check if the listing exists and get owner details
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // Get owner details
    const owner = await User.findById(listing.userRef);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Property owner not found" });
    }

    // Check if the listing is currently booked
    if (listing.status === 'booked') {
      return res.status(400).json({ success: false, message: "This property is currently unavailable" });
    }

    // Check if a booking already exists for this listing by the same tenant
    const existingBooking = await Booking.findOne({ 
      listingId, 
      tenantId,
      status: { $in: ['pending', 'approved'] } 
    });
    
    if (existingBooking) {
      return res.status(400).json({ 
        success: false, 
        message: "You already have an active booking for this listing." 
      });
    }

    // Create the new booking
    const newBooking = new Booking({
      ...req.body,
      status: 'pending',
    });
    
    await newBooking.save();
    
    // Populate tenant and listing details for the response
    const populatedBooking = await Booking.findById(newBooking._id)
      .populate('listingId', 'name regularPrice discountPrice type address')
      .populate('tenantId', 'username email');

    // Send email notification to the owner
    console.log('Attempting to send email notification to owner:', owner.email);
    
    const emailSent = await emailService.sendBookingNotification(
      owner.email,
      {
        name: listing.name,
        address: listing.address,
        type: listing.type,
        regularPrice: listing.regularPrice,
      },
      {
        name: tenantDetails.name,
        email: tenantDetails.email,
        phone: tenantDetails.phone,
      }
    );

    if (!emailSent) {
      console.warn('Failed to send email notification to owner');
    }
    
    res.status(201).json({ 
      success: true, 
      booking: populatedBooking,
      emailSent
    });
  } catch (error) {
    console.error('Error in createBooking:', error);
    next(error);
  }
};

export const getBookingsByTenant = async (req, res, next) => {
  try {
    const tenantId = req.params.id;
    
    // Validate the tenant exists
    const tenant = await User.findById(tenantId);
    if (!tenant) {
      return next(errorHandler(404, 'Tenant not found'));
    }
    
    const bookings = await Booking.find({ tenantId })
      .populate('listingId')
      .sort({ createdAt: -1 });
      
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

export const getBookingsByOwner = async (req, res, next) => {
  try {
    const ownerId = req.params.id;
    
    // Validate owner exists
    const owner = await User.findById(ownerId);
    if (!owner) {
      return next(errorHandler(404, 'Owner not found'));
    }
    
    const bookings = await Booking.find({ ownerRef: ownerId })
      .populate('tenantId', 'username email')
      .populate('listingId', 'name regularPrice discountPrice type address images')
      .sort({ createdAt: -1 });
      
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    
    // Validate the status value
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'" 
      });
    }
    
    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    // Get the listing associated with this booking
    const listing = await Listing.findById(booking.listingId);
    if (!listing) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    // If status is unchanged, return early
    if (booking.status === status) {
      return res.status(200).json({ success: true, booking, message: `Booking already ${status}` });
    }

    // Handle different status updates
    if (status === 'approved') {
      // Check if the listing is already booked
      if (listing.status === 'booked' && listing.bookedBy && listing.bookedBy.toString() !== booking.tenantId.toString()) {
        return res.status(400).json({ 
          success: false, 
          message: "This property has already been booked by another tenant" 
        });
      }
      
      // Update listing status to booked and set bookedBy
      listing.status = 'booked';
      listing.bookedBy = booking.tenantId;
      await listing.save();

      // Update other pending bookings for this listing to rejected
      await Booking.updateMany(
        {
          listingId: booking.listingId,
          _id: { $ne: booking._id },
          status: 'pending'
        },
        { status: 'rejected' }
      );
      
      // Get tenant details to send notification email
      const tenant = await User.findById(booking.tenantId);
      if (tenant && tenant.email) {
        console.log('Sending booking approval notification to tenant:', tenant.email);
        
        // Send email notification to tenant
        const emailSent = await emailService.sendBookingApprovalNotification(
          tenant.email,
          {
            name: listing.name,
            address: listing.address,
            type: listing.type,
            regularPrice: listing.regularPrice,
          },
          {
            id: booking._id,
            createdAt: booking.createdAt,
          }
        );
        
        if (!emailSent) {
          console.warn('Failed to send approval notification to tenant');
        }
      } else {
        console.warn('Tenant email not found, approval notification not sent');
      }
    } else if (status === 'rejected') {
      // If this was the approved booking, update listing status
      if (booking.status === 'approved') {
        listing.status = 'available';
        listing.bookedBy = null;
        await listing.save();
      }
    }

    // Update the booking status
    booking.status = status;
    await booking.save();

    // Get fully populated booking for response
    const populatedBooking = await Booking.findById(bookingId)
      .populate('listingId', 'name regularPrice discountPrice type address images')
      .populate('tenantId', 'username email');

    res.status(200).json({ 
      success: true, 
      booking: populatedBooking, 
      message: `Booking ${status} successfully` 
    });
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    next(error);
  }
};

export const deleteBooking = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    
    // Find the booking before deleting it
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // If this was the approved booking, update listing status
    if (booking.status === 'approved') {
      const listing = await Listing.findById(booking.listingId);
      if (listing) {
        listing.status = 'available';
        listing.bookedBy = null;
        await listing.save();
      }
    }

    // Delete the booking
    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    next(error);
  }
};

export const getBookingsByListing = async (req, res, next) => {
  try {
    const listingId = req.params.id;
    
    // Validate listing exists
    const listing = await Listing.findById(listingId);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found'));
    }
    
    const bookings = await Booking.find({ listingId })
      .populate('tenantId', 'username email')
      .sort({ createdAt: -1 });
      
    res.status(200).json(bookings);
  } catch (error) {
    next(error);
  }
};

// Test email functionality
export const testEmail = async (req, res, next) => {
  try {
    const testEmail = req.body.email || 'sanjeevr.20msc@kongu.edu';
    
    console.log('Testing email service with:', testEmail);
    
    const testListing = {
      name: 'Test Property',
      address: '123 Test Street',
      type: 'rent',
      regularPrice: 1500
    };
    
    const testBooking = {
      id: 'TEST-123',
      createdAt: new Date()
    };
    
    const emailSent = await emailService.sendBookingApprovalNotification(
      testEmail,
      testListing,
      testBooking
    );
    
    if (emailSent) {
      res.status(200).json({ 
        success: true, 
        message: 'Test email sent successfully' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send test email' 
      });
    }
  } catch (error) {
    console.error('Error in testEmail:', error);
    next(error);
  }
};