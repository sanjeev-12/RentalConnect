import { FaSearch } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { signOutUserStart, signOutUserSuccess, signOutUserFailure } from '../redux/user/userSlice';

export default function Header() {
  const currentUser = useSelector((state) => state.user.currentUser);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search)
    urlParams.set('searchTerm', searchTerm)
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`)
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const searchTermFromUrl = urlParams.get('searchTerm');
    if (searchTermFromUrl) {
      setSearchTerm(searchTermFromUrl)
    }
  }, [location.search])

  const handleProfileClick = () => {
    setShowMenu(!showMenu);
  };

  const handleSignOut = async () => {
    try {
      dispatch(signOutUserStart());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      
      if (res.ok) {
        dispatch(signOutUserSuccess());
        setShowMenu(false);
        navigate('/sign-in');
      } else {
        dispatch(signOutUserFailure(data.message));
      }
    } catch (error) {
      dispatch(signOutUserFailure(error.message));
    }
  };

  const getUserSpecificLinks = () => {
    if (!currentUser) return [];
    
    const links = [];
    
    // Messages link for all authenticated users
    links.push({
      to: '/messages',
      text: 'Messages'
    });
    
    // Only add Profile link for owners and admins, not for tenants
    if (currentUser.role === 'admin' || currentUser.role === 'owner') {
      links.push({
        to: '/profile',
        text: 'Profile'
      });
    }
    
    // Role-specific links
    if (currentUser.role === 'admin') {
      links.push({
        to: '/admin',
        text: 'Admin Dashboard'
      });
    } 
    
    else if (currentUser.role === 'owner') {
      links.push({
        to: '/owner-dashboard',
        text: 'Rent Reminder'
      });
      links.push({
        to: '/create-listing',
        text: 'Add Property'
      });
    } 
    
    else if (currentUser.role === 'tenant') {
      // Add tenant profile link for account settings
      links.push({
        to: '/tenant-profile',
        text: 'Account Settings'
      });
      
      links.push({
        to: '/tenant-bookings',
        text: 'My Bookings'
      });
    }
    
    return links;
  };

  return (
    <header className="bg-slate-200 shadow-md">
      <div className="flex justify-between items-center max-w-6xl m-auto p-3">
        <Link to={"/"}>
          <h1 className="font-bold text-sm sm:text-xl flex flex-wrap">
            <span className="text-slate-500">Rental</span>
            <span className="text-slate-700">Connect</span>
          </h1>
        </Link>

        <form onSubmit={handleSubmit} className="bg-slate-100 p-3 rounded-lg items-center flex">
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent focus:outline-none w-24 sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>
            <FaSearch className="text-slate-600" />
          </button>
        </form>
        <ul className="flex gap-4 items-center">
          <Link to={"/"}>
            <li className="hidden sm:inline text-slate-700 hover:underline">
              Home
            </li>
          </Link>
          <Link to={"/about"}>
            <li className="hidden sm:inline text-slate-700 hover:underline">
              About
            </li>
          </Link>
          
          {/* Display role-specific navigation */}
          {currentUser && (
            <div className="relative">
              <div onClick={handleProfileClick} className="cursor-pointer flex items-center">
                <img
                  src={currentUser.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                  alt="profile"
                  className="h-7 w-7 rounded-full object-cover"
                />
                <span className="ml-2 hidden sm:inline text-sm font-medium">
                  {currentUser.username}
                </span>
              </div>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                  {getUserSpecificLinks().map((link, index) => (
                    <Link 
                      key={index} 
                      to={link.to} 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      {link.text}
                    </Link>
                  ))}
                  
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t"
                    onClick={handleSignOut}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
          
          {!currentUser && (
            <Link to={"/sign-in"}>
              <li className="sm:inline text-slate-700 hover:underline">
                Sign in
              </li>
            </Link>
          )}
        </ul>
      </div>
    </header>
  );
}
