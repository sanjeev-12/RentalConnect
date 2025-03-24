import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";

export const sendMessage = async (req, res, next) => {
  const { sender, receiver, message } = req.body;

  try {
    const newMessage = new Chat({ sender, receiver, message });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  const { userId } = req.params;
  const { currentUserId } = req.query;

  try {
    const messages = await Chat.find({
      $or: [
        { sender: userId, receiver: currentUserId },
        { sender: currentUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    next(error);
  }
};

export const getReceivedMessages = async (req, res, next) => {
  const { receiverId } = req.query;

  try {
    const messages = await Chat.find({ receiver: receiverId }).populate('sender', 'username');
    res.status(200).json(messages.map(msg => ({
      ...msg._doc,
      senderName: msg.sender.username
    })));
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Find all messages where the user is either sender or receiver
    const messages = await Chat.find({
      $or: [{ sender: userId }, { receiver: userId }]
    }).sort({ createdAt: -1 });

    // Extract unique user IDs the current user has chatted with
    const uniqueUserIds = new Set();
    
    messages.forEach(msg => {
      if (msg.sender.toString() === userId) {
        uniqueUserIds.add(msg.receiver.toString());
      } else {
        uniqueUserIds.add(msg.sender.toString());
      }
    });

    // Get user details and last message for each conversation
    const conversations = await Promise.all(
      Array.from(uniqueUserIds).map(async (chatUserId) => {
        // Get user info
        const user = await User.findById(chatUserId);
        
        // Get last message
        const lastMsg = await Chat.findOne({
          $or: [
            { sender: userId, receiver: chatUserId },
            { sender: chatUserId, receiver: userId }
          ]
        }).sort({ createdAt: -1 });

        // Count unread messages
        const unreadCount = await Chat.countDocuments({
          sender: chatUserId,
          receiver: userId,
          read: { $ne: true }
        });

        return {
          userId: user._id,
          username: user.username,
          email: user.email,
          lastMessage: lastMsg?.message,
          lastMessageTime: lastMsg?.createdAt,
          unreadCount
        };
      })
    );

    // Sort by most recent message
    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

    res.status(200).json(conversations);
  } catch (error) {
    next(error);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  const { senderId, receiverId } = req.body;
  
  try {
    // Mark all messages from sender to receiver as read
    const result = await Chat.updateMany(
      { 
        sender: senderId,
        receiver: receiverId,
        read: false
      },
      { read: true }
    );
    
    res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} messages as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
};
