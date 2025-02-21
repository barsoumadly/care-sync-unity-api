const AsyncHandler = require('../../utils/AsyncHandler');
const Chat = require('../../models/Chat');
const ChatService = require('./chat.service');
const ApiError = require('../../utils/ApiError');
const { StatusCodes } = require('http-status-codes');

// Create new chat
const createChat = AsyncHandler(async (req, res) => {
  const { participants, type } = req.body;

  // Validate required fields
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    throw new ApiError('Participants are required', StatusCodes.BAD_REQUEST);
  }

  if (!type || !['individual', 'group'].includes(type)) {
    throw new ApiError('Invalid chat type', StatusCodes.BAD_REQUEST);
  }

  // For individual chat, ensure exactly 2 participants
  if (type === 'individual' && participants.length !== 2) {
    throw new ApiError('Individual chat must have exactly 2 participants', StatusCodes.BAD_REQUEST);
  }

  // Include the current user in participants if not already included
  if (!participants.includes(req.user.id)) {
    participants.push(req.user.id);
  }

  // Check if individual chat already exists between these participants
  if (type === 'individual') {
    const existingChat = await Chat.findOne({
      type: 'individual',
      participants: { $all: participants, $size: 2 }
    });

    if (existingChat) {
      return res.status(StatusCodes.OK).json({
        status: 'success',
        data: existingChat
      });
    }
  }

  // Create new chat
  const chat = await Chat.create({
    participants,
    type,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    data: chat
  });
});

// Get chat history
const getChatHistory = AsyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { limit = 50, skip = 0 } = req.query;

  // Validate chat exists and user is a participant
  const chat = await Chat.findOne({
    _id: chatId,
    participants: req.user.id
  });

  if (!chat) {
    throw new ApiError('Chat not found or access denied', StatusCodes.NOT_FOUND);
  }

  // Get chat history using service
  const messages = await ChatService.getChatHistory(chatId, parseInt(limit), parseInt(skip));

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: messages
  });
});

// Get user's chats
const getUserChats = AsyncHandler(async (req, res) => {
  const { limit = 20, skip = 0 } = req.query;

  // Find all chats where user is a participant
  const chats = await Chat.find({
    participants: req.user.id
  })
    .sort({ updatedAt: -1 })
    .skip(parseInt(skip))
    .limit(parseInt(limit))
    .populate('participants', 'name email');

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: chats
  });
});

module.exports = {
  createChat,
  getChatHistory,
  getUserChats
};