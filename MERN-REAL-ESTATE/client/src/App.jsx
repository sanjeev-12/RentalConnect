import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Profile from "./pages/Profile";
import SignIn from "./pages/SignIn";
import Header from "./components/Header";
import PrivateRoute from "./components/PrivateRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import CreateListing from "./pages/CreateListing";
import UpdateListing from "./pages/UpdateListing";
import Listing from "./pages/Listing";
import Search from "./pages/Search";
import OwnerDashboard from "./pages/OwnerDashboard";
import Profile2 from "./pages/profile2";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTest from "./pages/AdminTest";
import TenantBookings from "./pages/TenantBookings";
import TenantProfile from "./pages/TenantProfile";
import ChatPage from "./pages/ChatPage";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/about" element={<About />} />
        <Route path="/listing/:listingId" element={<Listing />} />
        <Route path="/search" element={<Search />} />
        
        {/* Routes that require authentication but no specific role */}
        <Route element={<PrivateRoute />}>
          <Route path="/tenant-bookings" element={<TenantBookings />} />
          <Route path="/tenant-profile" element={<TenantProfile />} />
          <Route path="/messages" element={<ChatPage />} />
        </Route>

        {/* Routes that require owner or admin role */}
        <Route element={<RoleBasedRoute allowedRoles={["owner", "admin"]} />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile2" element={<Profile2 />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/update-listing/:listingId" element={<UpdateListing />} />
          <Route path="/owner-dashboard" element={<OwnerDashboard />} />
        </Route>

        {/* Admin-only routes */}
        <Route element={<RoleBasedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-test" element={<AdminTest />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
