import Chat from "../models/chat.model.js";

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
