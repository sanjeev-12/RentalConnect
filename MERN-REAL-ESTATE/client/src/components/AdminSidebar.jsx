import { Link } from 'react-router-dom';
import { FaChartPie, FaUsers, FaHome, FaCalendarCheck, FaSignOutAlt } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { signOutUserStart, signOutUserSuccess, signOutUserFailure } from '../redux/user/userSlice';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const dispatch = useDispatch();

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (res.ok) {
        dispatch(signOutUserSuccess(data));
      } else {
        dispatch(signOutUserFailure(data.message));
      }
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaChartPie className="mr-2" /> },
    { id: 'users', label: 'Users', icon: <FaUsers className="mr-2" /> },
    { id: 'listings', label: 'Listings', icon: <FaHome className="mr-2" /> },
    { id: 'bookings', label: 'Bookings', icon: <FaCalendarCheck className="mr-2" /> },
  ];

  return (
    <div className="w-64 bg-slate-800 text-white min-h-screen p-4">
      <div className="mb-8">
        <Link to="/">
          <h2 className="text-2xl font-bold">RentalConnect Admin</h2>
        </Link>
      </div>
      <nav>
        <ul>
          {menuItems.map((item) => (
            <li key={item.id} className="mb-2">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full p-3 rounded-md transition-colors ${activeTab === item.id ? 'bg-slate-700' : 'hover:bg-slate-700'}`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
          <li className="mt-8">
            <button
              onClick={handleSignOut}
              className="flex items-center w-full p-3 rounded-md text-red-400 hover:bg-slate-700 transition-colors"
            >
              <FaSignOutAlt className="mr-2" />
              Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
