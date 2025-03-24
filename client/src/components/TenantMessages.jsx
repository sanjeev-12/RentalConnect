import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

export default function TenantMessages() {
  const [messages, setMessages] = useState([]);
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/chat/received?receiverId=${currentUser._id}`);
        const data = await res.json();
        console.log("Received messages:", data);
        setMessages(data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [currentUser._id]);

  return (
    <div className="tenant-messages border rounded-lg p-4 shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Messages from Tenants</h2>
      <div className="messages-list">
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg._id} className="p-2 my-1 rounded-md bg-gray-200">
              <p><strong>From:</strong> {msg.senderName}</p>
              <p>{msg.message}</p>
            </div>
          ))
        ) : (
          <p>No messages from tenants.</p>
        )}
      </div>
    </div>
  );
}
