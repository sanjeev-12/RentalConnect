import { FaUsers, FaHome, FaCalendarCheck, FaUserTie, FaUserAlt } from 'react-icons/fa';

export default function AdminStats({ stats, loading, error }) {
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
        <p>{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const { counts, recent } = stats;

  const statCards = [
    {
      title: 'Total Users',
      value: counts.users?.total || 0,
      icon: <FaUsers className="text-blue-500" size={24} />,
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Property Owners',
      value: counts.users?.owners || 0,
      icon: <FaUserTie className="text-green-500" size={24} />,
      bgColor: 'bg-green-50',
    },
    {
      title: 'Tenants',
      value: counts.users?.tenants || 0,
      icon: <FaUserAlt className="text-yellow-500" size={24} />,
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Total Listings',
      value: counts.listings || 0,
      icon: <FaHome className="text-purple-500" size={24} />,
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Bookings',
      value: counts.bookings?.total || 0,
      icon: <FaCalendarCheck className="text-indigo-500" size={24} />,
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Pending Bookings',
      value: counts.bookings?.pending || 0,
      icon: <FaCalendarCheck className="text-orange-500" size={24} />,
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`${card.bgColor} p-6 rounded-lg shadow-sm flex items-center justify-between`}
          >
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
              <p className="text-3xl font-bold text-gray-800">{card.value}</p>
            </div>
            <div className="p-3 rounded-full bg-white shadow-sm">{card.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaUsers className="mr-2 text-blue-500" /> Recent Users
          </h3>
          <div className="space-y-3">
            {recent.users?.map((user) => (
              <div key={user._id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                <img
                  src={user.avatar || '/default-avatar.png'}
                  alt={user.username}
                  className="w-10 h-10 rounded-full mr-3 object-cover"
                />
                <div>
                  <p className="font-medium">{user.username || 'No username'}</p>
                  <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
                </div>
                <span className="ml-auto text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {user.role || 'No role'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Listings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaHome className="mr-2 text-purple-500" /> Recent Listings
          </h3>
          <div className="space-y-3">
            {recent.listings?.map((listing) => (
              <div key={listing._id} className="p-2 hover:bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <img
                    src={listing.imageUrls?.[0] || '/default-listing.png'}
                    alt={listing.name}
                    className="w-10 h-10 rounded-md mr-3 object-cover"
                  />
                  <div>
                    <p className="font-medium">{listing.name || 'No name'}</p>
                    <p className="text-sm text-gray-500 truncate">{listing.address || 'No address'}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="font-semibold">
                      ₹{(listing.offer ? listing.discountPrice : listing.regularPrice || 0).toLocaleString()}
                    </p>
                    {listing.offer && (
                      <p className="text-xs text-gray-500 line-through">
                        ₹{listing.regularPrice?.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FaCalendarCheck className="mr-2 text-indigo-500" /> Recent Bookings
          </h3>
          <div className="space-y-3">
            {recent.bookings?.map((booking) => (
              <div key={booking._id} className="p-2 hover:bg-gray-50 rounded-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{booking.listingId?.name || 'Listing'}</p>
                    <p className="text-sm text-gray-500">by {booking.tenantId?.username || 'User'}</p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      booking.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : booking.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {booking.status || 'Pending'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
