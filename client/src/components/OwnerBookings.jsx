import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function OwnerBookings() {
  const { currentUser } = useSelector((state) => state.user);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/owner/${currentUser._id}`);
      
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

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      const res = await fetch(`/api/bookings/status/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${status === 'approved' ? 'accept' : 'deny'} booking`);
      }
      
      const updatedBooking = await res.json();
      
      if (updatedBooking.success) {
        toast.success(`Booking ${status === 'approved' ? 'accepted' : 'denied'} successfully!`);
        
        // Refresh bookings to reflect the updated listing availability and other booking statuses
        setTimeout(() => fetchBookings(), 1000);
      } else {
        throw new Error(updatedBooking.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error(error.message || 'Failed to update booking status');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete booking');
      }
      
      const data = await res.json();
      
      if (data.success) {
        setBookings((prevBookings) =>
          prevBookings.filter((booking) => booking._id !== bookingId)
        );
        toast.success('Booking deleted successfully!');
      } else {
        throw new Error(data.message || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error(error.message || 'Failed to delete booking');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <ToastContainer />
      <h2 className="text-2xl font-semibold mb-4">Your Property Bookings</h2>
      {bookings.length > 0 ? (
        bookings.map((booking) => (
          <div
            key={booking._id}
            className="bg-white p-4 rounded-lg shadow-md mb-4"
          >
            <h3 className="text-lg font-semibold">{booking.listingId?.name || 'Property'}</h3>
            <p>Client: {booking.tenantDetails?.name || 'Not provided'}</p>
            <p>Email: {booking.tenantDetails?.email || 'Not provided'}</p>
            <p>Phone: {booking.tenantDetails?.phone || 'Not provided'}</p>
            <p className={`font-semibold ${booking.status === 'approved' ? 'text-green-500' : booking.status === 'rejected' ? 'text-red-500' : 'text-yellow-500'}`}>
              Status: {booking.status === 'approved' ? 'Accepted' : booking.status === 'rejected' ? 'Denied' : 'Pending'}
            </p>
            <div className="flex gap-2 mt-2">
              {booking.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(booking._id, 'approved')}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(booking._id, 'rejected')}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Deny
                  </button>
                </>
              )}
              <button
                onClick={() => handleDeleteBooking(booking._id)}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No bookings found for your properties.</p>
      )}
    </div>
  );
}
