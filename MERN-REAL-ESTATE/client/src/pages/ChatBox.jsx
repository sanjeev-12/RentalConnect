import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

export default function ChatBox({ receiverId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { currentUser } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch(`/api/chat/${receiverId}?currentUserId=${currentUser._id}`);
      const data = await res.json();
      setMessages(data);
    };

    fetchMessages();

    socket.on("receiveMessage", (message) => {
      console.log("Message received:", message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [receiverId, currentUser._id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message = {
      sender: currentUser._id,
      receiver: receiverId,
      message: newMessage,
    };

    console.log("Sending message:", message);
    socket.emit("sendMessage", message);

    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });

    const data = await res.json();
    setMessages([...messages, data]);
    setNewMessage("");
  };

  return (
    <div className="chat-box border rounded-lg p-4 shadow-md max-w-md mx-auto">
      <div className="messages overflow-y-auto h-64 mb-4">
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`p-2 my-1 rounded-md ${
              msg.sender === currentUser._id ? "bg-blue-500 text-white self-end" : "bg-gray-200 text-black self-start"
            }`}
          >
            {msg.message}
          </div>
        ))}
      </div>
      <div className="flex items-center">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l-lg focus:outline-none"
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
