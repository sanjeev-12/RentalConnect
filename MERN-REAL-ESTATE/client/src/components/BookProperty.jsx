import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaBell, FaCalendarAlt } from 'react-icons/fa';

export default function BookProperty({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [bookingStatus, setBookingStatus] = useState('');
  const [formData, setFormData] = useState({
    name: currentUser?.username || '',
    email: currentUser?.email || '',
    phone: '',
  });
  // Track if reminder modal should be shown
  const [showReminderModal, setShowReminderModal] = useState(false);

  // Check booking status for this listing
  const checkBookingStatus = useCallback(async () => {
    if (!currentUser || !currentUser._id || !listing) return;
    
    try {
      // First check if the listing is already marked as booked
      if (listing.status === 'booked') {
        // If current user is the one who booked it
        if (listing.bookedBy && listing.bookedBy === currentUser._id) {
          setBookingStatus('accepted');
          // Automatically show reminder modal when booking is accepted
          setShowReminderModal(true);
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
        booking => booking.tenantId && (booking.tenantId._id === currentUser._id || booking.tenantId === currentUser._id)
      );

      if (approvedBooking) {
        // If there's an approved booking
        if (userBooking && userBooking._id === approvedBooking._id) {
          // Current user's booking was approved
          const previousStatus = bookingStatus;
          setBookingStatus('accepted');
          
          // Only trigger reminder modal if the status just changed to accepted
          if (previousStatus !== 'accepted') {
            setShowReminderModal(true);
          }
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
      toast.error('Could not verify booking status');
    }
  }, [currentUser, listing, bookingStatus]);

  // Check booking status when component mounts or when listing/user changes
  useEffect(() => {
    checkBookingStatus();
    
    // Set up polling to check status periodically
    const intervalId = setInterval(() => {
      checkBookingStatus();
    }, 5000); // Check every 5 seconds

    // Clean up interval when component unmounts
    return () => clearInterval(intervalId);
  }, [checkBookingStatus]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone) {
      return toast.error('Please provide your phone number');
    }

    try {
      setLoading(true);
      const bookingData = {
        listingId: listing._id,
        tenantId: currentUser._id,
        ownerRef: listing.userRef,
        tenantDetails: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      };

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        return toast.error(data.message || 'Failed to book property');
      }

      setBookingStatus('pending');
      toast.success('Property booked successfully! The owner will review your request.');
      // Reset form
      setFormData({
        ...formData,
        phone: '',
      });
    } catch (error) {
      setLoading(false);
      toast.error('Something went wrong with your booking');
      console.error('Booking error:', error);
    }
  };

  // Render based on booking status
  if (bookingStatus === 'unavailable' || listing.status === 'booked') {
    return (
      <div className="mt-4 p-4 bg-gray-100 border border-gray-300 rounded-md text-center">
        <p className="text-lg font-medium text-gray-800">This property is currently unavailable for booking.</p>
        <p className="text-sm text-gray-600 mt-2">Another tenant's booking has been accepted for this property.</p>
      </div>
    );
  }

  if (bookingStatus === 'accepted' || bookingStatus === 'approved') {
    return (
      <div className="mt-4">
        <div className="p-4 mb-4 bg-green-100 border border-green-300 rounded-md text-center">
          <p className="text-lg font-medium text-green-800">You have successfully booked this property!</p>
          <p className="text-sm text-green-600 mt-2">The owner has accepted your booking request.</p>
        </div>
        
        {/* Show the reminder modal or the reminder status */}
        {showReminderModal ? (
          <ReminderModal 
            listing={listing} 
            onClose={() => setShowReminderModal(false)} 
          />
        ) : (
          <ReminderForm listing={listing} />
        )}
      </div>
    );
  }

  if (bookingStatus === 'pending') {
    return (
      <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-md text-center">
        <p className="text-lg font-medium text-yellow-800">Your booking request is pending</p>
        <p className="text-sm text-yellow-600 mt-2">The owner will review your request shortly.</p>
      </div>
    );
  }

  if (bookingStatus === 'rejected') {
    return (
      <div className="mt-4">
        <div className="p-4 mb-4 bg-red-100 border border-red-300 rounded-md">
          <p className="font-medium text-red-800">Your previous booking request was declined.</p>
          <p className="text-sm text-red-600 mt-1">You can submit a new request if you'd like.</p>
        </div>
        <BookingForm 
          formData={formData} 
          handleChange={handleChange} 
          handleSubmit={handleSubmit} 
          loading={loading} 
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <ToastContainer />
      <BookingForm 
        formData={formData} 
        handleChange={handleChange} 
        handleSubmit={handleSubmit} 
        loading={loading} 
      />
    </div>
  );
}

// New Reminder Modal that automatically appears when booking is accepted
function ReminderModal({ listing, onClose }) {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [reminderData, setReminderData] = useState({
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
    amount: listing.regularPrice || 0,
    emailNotification: true,
    reminderDays: 3, // Days before due date to send reminder
  });

  // Get active booking for this listing
  const getActiveBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/listing/${listing._id}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      
      const bookings = await res.json();
      return bookings.find(booking => 
        booking.status === 'approved' && 
        (booking.tenantId === currentUser._id || 
         (booking.tenantId && booking.tenantId._id === currentUser._id))
      );
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  };
  
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setReminderData({
      ...reminderData,
      [e.target.name]: value
    });
  };
  
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Get the active booking first
      const activeBooking = await getActiveBooking();
      if (!activeBooking) {
        toast.error('Could not find your active booking for this property');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/reminder/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: activeBooking._id,
          dueDate: reminderData.dueDate,
          amount: reminderData.amount,
          emailNotification: reminderData.emailNotification,
          reminderDays: reminderData.reminderDays
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || 'Failed to create reminder');
        setLoading(false);
        return;
      }
      
      toast.success('Rent reminder created successfully! You will receive email notifications.');
      onClose();
    } catch (error) {
      toast.error('Something went wrong creating your reminder');
      console.error('Reminder error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <FaBell className="text-blue-500 mr-2" />
            Set Rent Reminder
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-gray-600">
            Great news! Your booking has been accepted. Set up a rent reminder to stay on top of your payments.
          </p>
        </div>
        
        <form onSubmit={handleCreateReminder}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dueDate">
              Due Date
            </label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={reminderData.dueDate}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">
              Amount (₹)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={reminderData.amount}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              min="1"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reminderDays">
              Remind me
            </label>
            <select
              id="reminderDays"
              name="reminderDays"
              value={reminderData.reminderDays}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1">1 day before due date</option>
              <option value="3">3 days before due date</option>
              <option value="5">5 days before due date</option>
              <option value="7">1 week before due date</option>
              <option value="14">2 weeks before due date</option>
            </select>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotification"
                name="emailNotification"
                checked={reminderData.emailNotification}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-700" htmlFor="emailNotification">
                Send me email notifications
              </label>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Skip for Now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Setting up...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Separated BookingForm component for reusability
function BookingForm({ formData, handleChange, handleSubmit, loading }) {
  return (
    <>
      <h2 className="text-lg font-semibold mb-3">Book this property</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">
            Your Name:
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border rounded-md mt-1"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-medium">
            Your Email:
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded-md mt-1"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="phone" className="text-sm font-medium">
            Your Phone Number:
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded-md mt-1"
            placeholder="Enter your phone number"
            required
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Book Now'}
        </button>
      </form>
    </>
  );
}

// New component for setting up rent reminders
function ReminderForm({ listing }) {
  const { currentUser } = useSelector((state) => state.user);
  const [loading, setLoading] = useState(false);
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderData, setReminderData] = useState({
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 30 days from now
    amount: listing.regularPrice || 0,
  });
  
  // Check if user already has reminders set for this listing
  useEffect(() => {
    const checkExistingReminders = async () => {
      try {
        const res = await fetch('/api/reminder/tenant', {
          credentials: 'include'
        });
        
        if (!res.ok) return;
        
        const data = await res.json();
        const existingReminder = data.find(reminder => 
          reminder.listingId && reminder.listingId._id === listing._id
        );
        
        if (existingReminder) {
          setHasReminder(true);
          setReminderData({
            dueDate: new Date(existingReminder.dueDate).toISOString().split('T')[0],
            amount: existingReminder.amount
          });
        }
      } catch (error) {
        console.error('Error checking reminders:', error);
      }
    };
    
    if (currentUser && listing) {
      checkExistingReminders();
    }
  }, [currentUser, listing]);
  
  // Get active booking for this listing
  const getActiveBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/listing/${listing._id}`);
      if (!res.ok) throw new Error('Failed to fetch bookings');
      
      const bookings = await res.json();
      return bookings.find(booking => 
        booking.status === 'approved' && 
        (booking.tenantId === currentUser._id || 
         (booking.tenantId && booking.tenantId._id === currentUser._id))
      );
    } catch (error) {
      console.error('Error fetching booking:', error);
      return null;
    }
  };
  
  const handleChange = (e) => {
    setReminderData({
      ...reminderData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleCreateReminder = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Get the active booking first
      const activeBooking = await getActiveBooking();
      if (!activeBooking) {
        toast.error('Could not find your active booking for this property');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/reminder/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: activeBooking._id,
          dueDate: reminderData.dueDate,
          amount: reminderData.amount
        })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        toast.error(data.message || 'Failed to create reminder');
        setLoading(false);
        return;
      }
      
      toast.success('Rent reminder created successfully!');
      setHasReminder(true);
    } catch (error) {
      toast.error('Something went wrong creating your reminder');
      console.error('Reminder error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (hasReminder) {
    return (
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-center mb-3">
          <FaBell className="text-blue-500 mr-2" />
          <h3 className="text-lg font-semibold text-blue-700">Rent Reminder Set</h3>
        </div>
        <p className="text-blue-600 mb-2">
          You have a rent reminder set for this property:
        </p>
        <div className="bg-white p-3 rounded-md border border-blue-100">
          <div className="flex justify-between">
            <div className="flex items-center">
              <FaCalendarAlt className="text-blue-400 mr-2" />
              <span className="font-medium">Due Date:</span>
            </div>
            <span>{new Date(reminderData.dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span className="font-medium">Amount:</span>
            <span>₹{reminderData.amount.toLocaleString()}</span>
          </div>
        </div>
        <p className="text-sm text-blue-500 mt-3">
          You can view and manage all your rent reminders in your profile.
        </p>
      </div>
    );
  }
  
  return (
    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <div className="flex items-center mb-3">
        <FaBell className="text-blue-500 mr-2" />
        <h3 className="text-lg font-semibold text-blue-700">Set Up Rent Reminder</h3>
      </div>
      <p className="text-blue-600 mb-4">
        Set up a reminder for your rent payments to avoid missing due dates.
      </p>
      
      <form onSubmit={handleCreateReminder} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dueDate">
            Due Date
          </label>
          <input
            type="date"
            id="dueDate"
            name="dueDate"
            value={reminderData.dueDate}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="amount">
            Amount (₹)
          </label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={reminderData.amount}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            min="1"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
        >
          {loading ? 'Setting up...' : 'Set Reminder'}
        </button>
      </form>
      
      <p className="text-sm text-blue-500 mt-3">
        You'll receive notifications about upcoming rent payments.
      </p>
    </div>
  );
}

BookingForm.propTypes = {
  formData: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

ReminderForm.propTypes = {
  listing: PropTypes.object.isRequired,
};

ReminderModal.propTypes = {
  listing: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

BookProperty.propTypes = {
  listing: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    userRef: PropTypes.string.isRequired,
    status: PropTypes.string,
    bookedBy: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
};
