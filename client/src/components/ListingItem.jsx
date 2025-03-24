import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt } from "react-icons/fa";
import { useState, useEffect, useCallback } from 'react';

export default function ListingItem({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [bookingStatus, setBookingStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Create a separate function for checking booking status
  const checkBookingStatus = useCallback(async () => {
    if (!currentUser || !currentUser._id || !listing) return;
    
    try {
      // First check if the listing is already marked as booked
      if (listing.status === 'booked') {
        // If current user is the one who booked it
        if (listing.bookedBy && listing.bookedBy === currentUser._id) {
          setBookingStatus('accepted');
        } else {
          // Another user has booked it
          setBookingStatus('unavailable');
        }
        return;
      }

      // Get all bookings for this listing
      const res = await fetch(`/api/bookings/listing/${listing._id}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      
      const allBookings = await res.json();
      
      // Check if there's any approved booking for this listing
      const approvedBooking = allBookings.find(booking => booking.status === 'approved');
      
      // Check the current user's booking status
      const userBooking = currentUser && allBookings.find(
        booking => booking.tenantId && booking.tenantId._id === currentUser._id
      );

      if (approvedBooking) {
        // If there's an approved booking
        if (userBooking && userBooking._id === approvedBooking._id) {
          // Current user's booking was approved
          setBookingStatus('accepted');
        } else {
          // Another user's booking was approved
          setBookingStatus('unavailable');
        }
      } else if (userBooking) {
        // Current user has a pending/rejected booking
        setBookingStatus(userBooking.status);
      } else {
        // No approved bookings and user doesn't have a booking
        setBookingStatus('');
      }
    } catch (error) {
      console.error('Error checking booking status:', error);
      setErrorMessage('Failed to check booking status');
    }
  }, [currentUser, listing]);

  // Initial check when component mounts or listing/currentUser changes
  useEffect(() => {
    checkBookingStatus();
    
    // Set up polling to check status periodically
    const intervalId = setInterval(() => {
      checkBookingStatus();
    }, 5000); // Check every 5 seconds

    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, [checkBookingStatus]);

  const handleBook = async () => {
    if (!currentUser) return;
    setErrorMessage('');
    
    try {
      const bookingData = {
        listingId: listing._id,
        tenantId: currentUser._id,
        ownerRef: listing.userRef,
        tenantDetails: {
          name: currentUser.username,
          email: currentUser.email,
          phone: phone
        }
      };

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      
      if (data.success) {
        setBookingStatus('pending');
        setShowBookingForm(false);
      } else {
        setErrorMessage(data.message || 'Failed to book property');
      }
    } catch (error) {
      console.error('Error booking property:', error);
      setErrorMessage('Error booking property. Please try again.');
    }
  };

  const getBookingStatusButton = () => {
    switch(bookingStatus) {
      case 'accepted':
        return (
          <Link to={`/listing/${listing._id}`} className="block">
            <button
              className="bg-green-500 text-white w-full py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Booking & Reminders
            </button>
          </Link>
        );
      case 'approved':
        return (
          <Link to={`/listing/${listing._id}`} className="block">
            <button
              className="bg-green-500 text-white w-full py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Booking & Reminders
            </button>
          </Link>
        );
      case 'pending':
        return (
          <Link to={`/listing/${listing._id}`} className="block">
            <button
              className="bg-yellow-500 text-white w-full py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Booking Status
            </button>
          </Link>
        );
      case 'rejected':
        return (
          <Link to={`/listing/${listing._id}`} className="block">
            <button
              className="bg-blue-500 text-white w-full py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Book Again
            </button>
          </Link>
        );
      case 'unavailable':
        return (
          <button
            disabled
            className="bg-gray-500 text-white w-full py-2.5 rounded-lg font-medium cursor-not-allowed"
          >
            Currently Unavailable
          </button>
        );
      default:
        return (
          <Link to={`/listing/${listing._id}`} className="block">
            <button
              className="bg-blue-500 text-white w-full py-2.5 rounded-lg font-medium hover:bg-blue-600 transition-colors"
            >
              Book Now
            </button>
          </Link>
        );
    }
  };

  const defaultImg = 'https://ysac.ca/wp-content/uploads/2023/06/Illustration-House-investment-growth-Real-estate-Property-value.webp'
  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px] relative group">
      <Link to={`/listing/${listing._id}`}>
        <div className="relative">
          <img
            src={listing.imageUrls[0] || defaultImg}
            alt="listing cover"
            className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {listing.offer && (
            <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {listing.discountPrice ? `${((listing.regularPrice - listing.discountPrice) / listing.regularPrice * 100).toFixed(0)}% OFF` : 'Special Offer'}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-slate-900 line-clamp-1">
              {listing.name}
            </h3>
            <div className="text-sm text-gray-500">
              {listing.type === 'rent' ? 'For Rent' : 'For Sale'}
            </div>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
            <FaMapMarkerAlt className="w-4 h-4" />
            <span className="line-clamp-1">{listing.address}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {listing.type === 'rent' ? 'Monthly' : 'Sale'}
            </span>
            <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {listing.status === 'booked' ? 'Booked' : 'Available'}
            </span>
          </div>
          
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-slate-900">
              ₹{listing.offer ? listing.discountPrice : listing.regularPrice}
            </h4>
            {listing.offer && (
              <span className="text-sm text-gray-400 line-through">
                ₹{listing.regularPrice}
              </span>
            )}
            {listing.type === 'rent' && (
              <span className="text-sm text-gray-500">/month</span>
            )}
          </div>
        </div>
      </Link>
      
      <div className="p-4 border-t">
        {getBookingStatusButton()}
      </div>
    </div>
  );
}

ListingItem.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    regularPrice: PropTypes.number.isRequired,
    discountPrice: PropTypes.number,
    offer: PropTypes.bool,
    status: PropTypes.string,
    bookedBy: PropTypes.string,
    imageUrls: PropTypes.arrayOf(PropTypes.string).isRequired,
    userRef: PropTypes.string.isRequired,
  }).isRequired,
};