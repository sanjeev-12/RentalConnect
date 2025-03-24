import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'
import { app } from '../firebase';
import { useDispatch } from 'react-redux';
import { signInSuccess } from '../redux/user/userSlice';
import { useNavigate } from 'react-router';
import { useState } from 'react';

export default function OAuth() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [error, setError] = useState(null);

  const handleGoogleClick = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const auth = getAuth(app)

      const result = await signInWithPopup(auth, provider)
      
      // Add default values for required fields
      const userData = {
        name: result.user.displayName,
        email: result.user.email,
        photo: result.user.photoURL,
        // Default values for required fields
        phone: "Please update",
        address: "Please update",
        city: "Please update",
        state: "Please update",
        country: "Please update",
        zipCode: "00000"
      };
      
      try {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
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
        
        dispatch(signInSuccess(data));
        navigate('/');
      } catch (error) {
        console.error('Error completing Google sign-in:', error);
        setError(error.message || 'Failed to complete sign-in process');
      }
    } catch (error) {
      console.log('could not sign in with google', error);
      setError('Could not sign in with Google. Please try again.');
    }
  };

  return (
    <>
      <button
        onClick={handleGoogleClick}
        type="button"
        className="
          bg-red-700 
          text-white 
          p-3 
          rounded-lg 
          uppercase 
          hover:opacity-50"
      >
        Continue with Google
      </button>
      {error && <p className="text-red-500 mt-3">{error}</p>}
    </>
  )
}
