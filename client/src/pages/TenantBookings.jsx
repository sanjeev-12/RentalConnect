import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Link } from 'react-router-dom';

export default function TenantBookings() {
  const { currentUser } = useSelector((state) => state.user);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);

  // Status color mapping
  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/tenant/${currentUser._id}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch bookings');
      }
      
      const data = await res.json();
      setBookings(data);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(error.message || 'Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchBookings();
    }
  }, [currentUser]);

  const handleCancelClick = (booking) => {
    setBookingToCancel(booking);
    setShowCancelModal(true);
  };

  const handleCancelBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingToCancel._id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to cancel booking');
      }
      
      const data = await res.json();
      
      if (data.success) {
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking._id !== bookingToCancel._id)
        );
        toast.success('Booking cancelled successfully!');
        setShowCancelModal(false);
        setBookingToCancel(null);
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">My Bookings</h1>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <ToastContainer />
        <h1 className="text-3xl font-semibold mb-6">My Bookings</h1>
        
        {bookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {/* Property Image */}
                {booking.listingId?.imageUrls && booking.listingId.imageUrls[0] && (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={booking.listingId.imageUrls[0]} 
                      alt={booking.listingId.name || 'Property'} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  {/* Property Name with Link */}
                  <h2 className="text-xl font-semibold mb-2">
                    {booking.listingId ? (
                      <Link to={`/listing/${booking.listingId._id}`} className="text-blue-600 hover:underline">
                        {booking.listingId.name || 'Property'}
                      </Link>
                    ) : (
                      'Property'
                    )}
                  </h2>
                  
                  {/* Property Address */}
                  {booking.listingId?.address && (
                    <p className="text-gray-500 mb-2">{booking.listingId.address}</p>
                  )}
                  
                  {/* Booking Status */}
                  <div className="flex items-center mt-3 mb-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusColors[booking.status] || 'bg-gray-100'}`}>
                      {booking.status === 'approved' ? 'Confirmed' : 
                       booking.status === 'rejected' ? 'Declined' : 'Pending'}
                    </span>
                  </div>
                  
                  {/* Booking Date */}
                  <p className="text-sm text-gray-600 mb-1">
                    <span className="font-medium">Booked on:</span> {formatDate(booking.createdAt)}
                  </p>
                  
                  {/* Price */}
                  {booking.listingId?.regularPrice && (
                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Price:</span> ${booking.listingId.offer ? 
                        booking.listingId.discountPrice : 
                        booking.listingId.regularPrice}{booking.listingId.type === 'rent' ? '/month' : ''}
                    </p>
                  )}
                  
                  {/* Cancel Button - Only for pending bookings */}
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleCancelClick(booking)}
                      className="mt-2 w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition duration-200"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 mb-4">You don't have any bookings yet.</p>
            <Link to="/" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Browse Properties
            </Link>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-4">Cancel Booking</h3>
            <p className="mb-4">Are you sure you want to cancel this booking? This action cannot be undone.</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded"
              >
                Keep Booking
              </button>
              <button
                onClick={handleCancelBooking}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
