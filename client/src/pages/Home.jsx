import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css/bundle";
import ListingItem from "../components/ListingItem";
import { useSelector } from "react-redux";
import { FaSearch, FaHome, FaBuilding, FaChartLine } from "react-icons/fa";

export default function Home() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  
  SwiperCore.use([Navigation]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        setLoading(true);
        const userParam = currentUser ? `&userRole=${currentUser.role}&userId=${currentUser._id}` : '';
        const res = await fetch(`/api/listing/get?limit=12${userParam}`);
        const data = await res.json();
        setListings(data);
      } catch (error) {
        console.error('Error fetching listings:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    fetchListings();
  }, [currentUser]);

  const getRoleSpecificTitle = () => {
    if (!currentUser) return null;
    
    switch (currentUser.role) {
      case 'owner':
        return (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h2 className="text-2xl font-semibold text-blue-800">My Properties</h2>
            <p className="text-blue-600">Manage and view your listed properties</p>
          </div>
        );
      case 'tenant':
        return (
          <div className="mb-6 bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h2 className="text-2xl font-semibold text-green-800">Available Properties</h2>
            <p className="text-green-600">Browse and book your next perfect home</p>
          </div>
        );
      case 'admin':
        return (
          <div className="mb-6 bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
            <h2 className="text-2xl font-semibold text-purple-800">All Properties</h2>
            <p className="text-purple-600">Monitoring all listings in the system</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-75"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Find Your Perfect Home
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Discover a wide range of properties for rent and sale. Find your dream home with ease.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/search"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                <FaSearch className="w-5 h-5" />
                Start Searching
              </Link>
              <Link
                to="/about"
                className="bg-white hover:bg-gray-50 text-blue-600 px-8 py-3 rounded-lg font-semibold flex items-center gap-2 border border-blue-600"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <FaHome className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Find Your Home</h3>
            <p className="text-slate-600">Browse thousands of properties for rent and sale.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <FaBuilding className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">List Your Property</h3>
            <p className="text-slate-600">List your property and reach potential tenants.</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <FaChartLine className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Track Your Listings</h3>
            <p className="text-slate-600">Monitor your listings and manage bookings.</p>
          </div>
        </div>
      </div>

      {/* Role-specific title */}
      <div className="max-w-8xl mx-auto p-3">
        {getRoleSpecificTitle()}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="max-w-8xl mx-auto p-3 text-center">
          <p className="text-red-500">Something went wrong fetching listings. Please try again later.</p>
        </div>
      )}

      {/* Listings Grid */}
      <div className="max-w-8xl mx-auto p-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mx-4">
          {listings.map((listing) => (
            <div className="ml-4" key={listing._id}>
              <ListingItem listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
