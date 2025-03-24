import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

export default function RoleBasedRoute({ allowedRoles }) {
  const { currentUser } = useSelector((state) => state.user);
  const location = useLocation();

  // If not logged in, redirect to sign in
  if (!currentUser) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // If user's role is not in the allowed roles, redirect to home page
  if (!allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  // If user has the required role, allow access
  return <Outlet />;
}

RoleBasedRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
};
