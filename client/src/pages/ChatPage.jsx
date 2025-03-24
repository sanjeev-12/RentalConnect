import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import ChatBox from '../components/ChatBox';
import { FaUserCircle, FaSearch } from 'react-icons/fa';

export default function ChatPage() {
  const { currentUser } = useSelector((state) => state.user);
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        // Fetch unique users the current user has chatted with
        const res = await fetch(`/api/chat/conversations/${currentUser._id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch conversations');
        }
        
        const data = await res.json();
        setChats(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load conversations. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchChats();
    }
  }, [currentUser]);

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const filteredChats = chats.filter(chat => 
    chat.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p className="font-bold">Not Logged In</p>
          <p>You need to be logged in to access your messages.</p>
          <Link to="/sign-in" className="text-blue-600 hover:underline mt-2 inline-block">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-slate-700">My Messages</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
          {/* Chat list sidebar */}
          <div className="w-full md:w-1/3 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {filteredChats.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {searchTerm ? 'No matching conversations found' : 'No conversations yet'}
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div 
                    key={chat.userId}
                    onClick={() => handleUserSelect(chat)}
                    className={`p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 flex items-center ${selectedUser?.userId === chat.userId ? 'bg-blue-50' : ''}`}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex justify-center items-center mr-3">
                      <FaUserCircle className="text-blue-600 text-2xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{chat.username}</h3>
                      <p className="text-sm text-gray-500 truncate">{chat.lastMessage || 'Start a conversation'}</p>
                    </div>
                    {chat.unreadCount > 0 && (
                      <div className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
            {selectedUser ? (
              <>
                <div className="px-4 py-3 border-b border-gray-200 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex justify-center items-center mr-2">
                    <FaUserCircle className="text-blue-600 text-xl" />
                  </div>
                  <h3 className="font-medium">{selectedUser.username}</h3>
                </div>
                <div className="flex-1">
                  <ChatBox receiverId={selectedUser.userId} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4">
                <FaUserCircle className="text-gray-300 text-6xl mb-4" />
                <p className="text-xl mb-2">Select a conversation</p>
                <p className="text-center max-w-md">
                  Choose a conversation from the list or start a new one by visiting a property listing and contacting the owner.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
