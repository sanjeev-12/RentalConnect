import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

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
  }, [receiverId, currentUser._id]);

  const handleSendMessage = async () => {
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
  };

  return (
    <div className="chat-box">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg._id} className={msg.sender === currentUser._id ? "sent" : "received"}>
            {msg.message}
          </div>
        ))}
      </div>
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
