import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { FaBell, FaCalendarAlt, FaCheck, FaTimes, FaEdit } from 'react-icons/fa';

function OwnerReminders() {
  const { currentUser } = useSelector(state => state.user);
  const [bookings, setBookings] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({
    dueDate: '',
    amount: '',
    reminderDays: '3',
    emailNotification: true,
    message: ''
  });

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        if (!currentUser || !currentUser._id) {
          console.error('No user ID available');
          toast.error('User ID not available. Please log in again.');
          setLoading(false);
          return;
        }

        console.log('Fetching bookings for owner ID:', currentUser._id);
        const res = await fetch(`/api/bookings/owner/${currentUser._id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response:', errorText);
          throw new Error(`Failed to fetch bookings: ${res.status} ${res.statusText}`);
        }
        
        // Check if the response is valid JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Received non-JSON response:', contentType);
          throw new Error('Received non-JSON response from server');
        }
        
        let data;
        try {
          data = await res.json();
        } catch (err) {
          console.error('Error parsing JSON:', err);
          throw new Error('Unexpected end of JSON input');
        }
        
        console.log('Bookings data received:', data);
        
        // Filter for approved bookings as those are the ones where reminders are needed
        const acceptedBookings = data.filter(booking => booking.status === 'approved');
        console.log('Approved bookings:', acceptedBookings.length);
        setBookings(acceptedBookings);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error(error.message || 'Failed to fetch bookings');
      }
    };

    const fetchReminders = async () => {
      try {
        console.log('Fetching reminders for owner...');
        const res = await fetch('/api/reminder/owner', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response from reminders API:', errorText);
          throw new Error(`Failed to fetch reminders: ${res.status} ${res.statusText}`);
        }
        
        // Check if the response is valid JSON
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Received non-JSON response for reminders:', contentType);
          throw new Error('Received non-JSON response from server');
        }
        
        let data;
        try {
          data = await res.json();
        } catch (err) {
          console.error('Error parsing JSON in reminders response:', err);
          throw new Error('Unexpected end of JSON input');
        }
        
        console.log('Reminders data received:', data);
        setReminders(data);
      } catch (error) {
        console.error('Error fetching reminders:', error);
        toast.error(error.message || 'Failed to fetch reminders');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchBookings();
      fetchReminders();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const openReminderModal = (booking) => {
    setSelectedBooking(booking);
    
    // Set default values
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    setFormData({
      dueDate: nextMonth.toISOString().split('T')[0], // Default to one month from now
      amount: booking.listingId.regularPrice || 0,
      reminderDays: '3',
      emailNotification: true,
      message: `Rent reminder for your booking at ${booking.listingId.name || booking.listingId.address}`
    });
    
    setShowReminderModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    
    if (!selectedBooking) {
      toast.error('No booking selected');
      return;
    }
    
    try {
      setLoading(true);
      
      const res = await fetch('/api/reminder/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          dueDate: formData.dueDate,
          amount: formData.amount,
          emailNotification: formData.emailNotification,
          reminderDays: formData.reminderDays,
          message: formData.message
        })
      });
      
      // Check if the response is valid JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Received non-JSON response from server');
      }
      
      let data;
      try {
        data = await res.json();
      } catch (err) {
        console.error('Error parsing JSON:', err);
        throw new Error('Unexpected end of JSON input');
      }
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create reminder');
      }
      
      toast.success('Reminder created successfully!');
      setShowReminderModal(false);
      
      // Refresh the reminders list
      const updatedReminders = [...reminders, data];
      setReminders(updatedReminders);
      
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast.error(error.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FaBell className="text-blue-500 mr-2" />
        Manage Tenant Reminders
      </h2>
      
      {/* Existing Reminders */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Existing Reminders</h3>
        {reminders.length === 0 ? (
          <p className="text-gray-500">No reminders set yet. Create a reminder for your tenants below.</p>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <div key={reminder._id} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{reminder.listingId?.name || 'Property'}</h4>
                  <span className={`px-2 py-1 rounded text-xs ${
                    reminder.status === 'paid' ? 'bg-green-100 text-green-800' : 
                    reminder.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-600">Due Date:</p>
                    <p>{formatDate(reminder.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount:</p>
                    <p>₹{reminder.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Tenant:</p>
                    <p>{reminder.tenantId?.username || 'Tenant'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email Notification:</p>
                    <p>{reminder.emailNotification ? 
                      <FaCheck className="text-green-500" /> : 
                      <FaTimes className="text-red-500" />}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Bookings that can have reminders */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3">Create New Reminders</h3>
        {bookings.length === 0 ? (
          <p className="text-gray-500">No accepted bookings found. Once you accept a booking, you can set reminders here.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">{booking.listingId?.name || 'Property'}</h4>
                    <p className="text-sm text-gray-600">Tenant: {booking.tenantId?.username}</p>
                  </div>
                  <button
                    onClick={() => openReminderModal(booking)}
                    className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600 flex items-center"
                  >
                    <FaCalendarAlt className="mr-1" /> Set Reminder
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Reminder Modal */}
      {showReminderModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Set Rent Reminder</h2>
            </div>
            <form onSubmit={handleCreateReminder} className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="dueDate">
                  Due Date
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="amount">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  id="amount"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  min="1"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="reminderDays">
                  Send Reminder Days Before Due Date
                </label>
                <select
                  id="reminderDays"
                  name="reminderDays"
                  value={formData.reminderDays}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="1">1 day before</option>
                  <option value="3">3 days before</option>
                  <option value="5">5 days before</option>
                  <option value="7">7 days before</option>
                  <option value="14">14 days before</option>
                  <option value="30">30 days before</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="message">
                  Custom Message (Optional)
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  placeholder="Add a personal message to your tenant"
                ></textarea>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="emailNotification"
                    name="emailNotification"
                    checked={formData.emailNotification}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm" htmlFor="emailNotification">
                    Send email notification to tenant
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {loading ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerReminders;
