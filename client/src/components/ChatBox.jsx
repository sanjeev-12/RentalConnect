import { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import PropTypes from 'prop-types';
import { FaPaperPlane } from 'react-icons/fa';

export default function ChatBox({ receiverId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const messagesEndRef = useRef(null);

  // Fetch messages on component mount and when receiverId changes
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/chat/${receiverId}?currentUserId=${currentUser._id}`);
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // Poll for new messages every 5 seconds
    const intervalId = setInterval(() => {
      fetchMessages();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [receiverId, currentUser._id]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: currentUser._id,
          receiver: receiverId,
          message: newMessage,
        }),
      });

      const data = await res.json();
      setMessages([...messages, data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col h-96 mt-4">
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg._id}
              className={`max-w-[80%] mb-3 ${msg.sender === currentUser._id ? "ml-auto" : "mr-auto"}`}
            >
              <div
                className={`p-3 rounded-lg ${msg.sender === currentUser._id
                  ? "bg-blue-600 text-white rounded-br-none"
                  : "bg-gray-200 text-gray-800 rounded-bl-none"
                  }`}
              >
                {msg.message}
              </div>
              <div className={`text-xs mt-1 text-gray-500 ${msg.sender === currentUser._id ? "text-right" : "text-left"}`}>
                {formatTimestamp(msg.createdAt)}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-l-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-lg disabled:bg-blue-300 flex items-center justify-center"
        >
          <FaPaperPlane className="mr-1" /> Send
        </button>
      </form>
    </div>
  );
}

ChatBox.propTypes = {
  receiverId: PropTypes.string.isRequired,
};
