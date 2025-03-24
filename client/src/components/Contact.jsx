import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import ChatBox from "./ChatBox";
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';

export default function Contact({listing}) {
  const [landlord, setLandlord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLandlord = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/user/${listing.userRef}`);
        const data = await res.json();
        
        if (data.success === false) {
          setError(data.message);
          return;
        }
        
        setLandlord(data);
        setError(null);
      } catch (error) {
        setError('Failed to fetch landlord information');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchLandlord();
  }, [listing.userRef]);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
        <p className="font-bold">Error</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <>
      {landlord && (
        <div className='flex flex-col gap-4 mt-2'>
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
            <h3 className="font-semibold text-xl mb-4 text-gray-800">
              Contact {landlord.username} about {listing.name}
            </h3>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <FaUser className="text-blue-600" />
                <span>{landlord.username}</span>
              </div>
              
              {landlord.email && (
                <div className="flex items-center gap-3 mb-2">
                  <FaEnvelope className="text-blue-600" />
                  <a href={`mailto:${landlord.email}`} className="text-blue-600 hover:underline">
                    {landlord.email}
                  </a>
                </div>
              )}
              
              {landlord.phone && (
                <div className="flex items-center gap-3">
                  <FaPhone className="text-blue-600" />
                  <a href={`tel:${landlord.phone}`} className="text-blue-600 hover:underline">
                    {landlord.phone}
                  </a>
                </div>
              )}
            </div>
            
            <h4 className="font-medium text-lg mb-2 text-gray-800">
              Send a direct message
            </h4>
            
            <ChatBox receiverId={landlord._id} />
          </div>
        </div>
      )}
    </>
  );
}

Contact.propTypes = {
  listing: PropTypes.shape({
    userRef: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
  }).isRequired,
};
