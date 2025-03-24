import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function AdminTest() {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }

    // Just log the user info for debugging
    console.log('Current user:', currentUser);
  }, [currentUser, navigate]);

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-6">Admin Test Page</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">User Information</h2>
        {currentUser ? (
          <div>
            <p><strong>Username:</strong> {currentUser.username}</p>
            <p><strong>Email:</strong> {currentUser.email}</p>
            <p><strong>Role:</strong> {currentUser.role}</p>
            <p><strong>User ID:</strong> {currentUser._id}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>
    </div>
  );
}
