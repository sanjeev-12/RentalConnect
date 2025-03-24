import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import AdminStats from '../components/AdminStats';
import AdminUsersList from '../components/AdminUsersList';
import AdminListingsList from '../components/AdminListingsList';
import AdminBookingsList from '../components/AdminBookingsList';

export default function AdminDashboard() {
  const { currentUser } = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Debug logging
    console.log('Current user in AdminDashboard:', currentUser);

    if (!currentUser) {
      console.log('No current user, redirecting to sign-in');
      navigate('/sign-in');
      return;
    }

    if (!currentUser.role || currentUser.role !== 'admin') {
      console.log(`User role is not admin: ${currentUser.role}, redirecting to home`);
      navigate('/');
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('Fetching admin stats...');
        const res = await fetch('/api/admin/stats', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log('Stats API response status:', res.status);
        
        if (res.status === 403) {
          console.log('Access denied (403), redirecting to home');
          navigate('/');
          return;
        }
        
        const data = await res.json();
        console.log('Stats data received:', data);
        
        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch stats');
        }
        
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser, navigate]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <AdminStats stats={stats} loading={loading} error={error} />;
      case 'users':
        return <AdminUsersList />;
      case 'listings':
        return <AdminListingsList />;
      case 'bookings':
        return <AdminBookingsList />;
      default:
        return <AdminStats stats={stats} loading={loading} error={error} />;
    }
  };

  // Show a basic loading state while checking user authentication
  if (!currentUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Show a message if user is not an admin
  if (currentUser.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Access denied. Admin privileges required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>
        {renderContent()}
      </div>
    </div>
  );
}
