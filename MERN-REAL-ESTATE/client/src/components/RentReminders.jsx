import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { FaCalendar, FaCheck, FaClock, FaExclamationTriangle } from 'react-icons/fa';

export default function RentReminders() {
  const { currentUser } = useSelector(state => state.user);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReminders();
  }, [currentUser?.role]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      setError(null);
      const endpoint = currentUser?.role === 'owner' ? '/api/reminder/owner' : '/api/reminder/tenant';
      const res = await fetch(endpoint, {
        credentials: 'include'
      });
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      // Safely parse JSON
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Failed to parse server response');
      }
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch reminders');
      }
      
      setReminders(data);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.message || 'An error occurred while fetching reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reminderId, newStatus) => {
    try {
      const res = await fetch(`/api/reminder/${reminderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      
      // Handle non-JSON responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      // Safely parse JSON
      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        throw new Error('Failed to parse server response');
      }
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update reminder status');
      }
      
      // Update the local state
      setReminders(reminders.map(reminder => 
        reminder._id === reminderId ? { ...reminder, status: newStatus } : reminder
      ));
    } catch (error) {
      console.error('Update error:', error);
      setError(error.message || 'An error occurred while updating the reminder');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FaCheck className="text-green-500" />;
      case 'pending':
        return <FaClock className="text-yellow-500" />;
      case 'overdue':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-semibold mb-6 flex items-center">
        <FaCalendar className="mr-2 text-blue-500" />
        Rent Reminders
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {reminders.map((reminder) => (
          <div
            key={reminder._id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{reminder.listingId.name}</h3>
                <p className="text-sm text-gray-500">{reminder.listingId.address}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">₹{reminder.amount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">
                  Due: {new Date(reminder.dueDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(reminder.status)}`}>
                  {getStatusIcon(reminder.status)}
                  <span className="ml-2 capitalize">{reminder.status}</span>
                </span>
              </div>

              {currentUser?.role === 'owner' && reminder.status === 'pending' && (
                <button
                  onClick={() => handleUpdateStatus(reminder._id, 'paid')}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                >
                  Mark as Paid
                </button>
              )}

              {currentUser?.role === 'tenant' && (
                <div className="text-sm text-gray-500">
                  {reminder.status === 'pending' && (
                    <p>Please ensure timely payment</p>
                  )}
                  {reminder.status === 'overdue' && (
                    <p className="text-red-500 font-semibold">Payment Overdue!</p>
                  )}
                </div>
              )}
            </div>

            {reminder.status === 'overdue' && (
              <div className="mt-2 text-sm text-red-500">
                Payment was due on {new Date(reminder.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No rent reminders found.
          </div>
        )}
      </div>
    </div>
  );
}
