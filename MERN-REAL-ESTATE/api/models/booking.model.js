// api/models/booking.model.js
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ownerRef: {
    type: String,
    required: true
  },
  tenantDetails: {
    name: String,
    email: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;