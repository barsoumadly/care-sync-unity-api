const Chat = require("../../models/Chat");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const { Server } = require("socket.io");
const { deleteFile } = require("../shared/services/file.service");

// Store active connections
const activeUsers = new Map();

// Rate limiting map for message sending
const messageRateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_MESSAGES_PER_WINDOW = 60; // 60 messages per minute

let io;

/**
 * Initialize Socket.IO server
 * @param {Object} server - HTTP server instance
 */
const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    maxHttpBufferSize: 1e6 // 1 MB max message size
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication failed"));
      }

      // Validate token and get user (assuming you have a token validation utility)
      const user = await validateToken(token);
      if (!user) {
        return next(new Error("Invalid token"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  io.on("connection", handleSocketConnection);
};

/**
 * Handle new socket connections
 * @param {Object} socket - Socket instance
 */
const handleSocketConnection = (socket) => {
  const userId = socket.user._id.toString();
  
  // Store user's socket connection
  activeUsers.set(userId, {
    socketId: socket.id,
    userId: userId,
    status: "online"
  });

  // Broadcast user's online status
  socket.broadcast.emit("user:online", { userId });

  // Join user's personal room for private messages
  socket.join(userId);

  // Handle disconnection
  socket.on("disconnect", () => handleDisconnect(socket));

  // Handle messages
  socket.on("message:send", (data) => handleMessage(socket, data));

  // Handle typing status
  socket.on("typing:start", (data) => handleTypingStatus(socket, data, true));
  socket.on("typing:stop", (data) => handleTypingStatus(socket, data, false));

  // Handle read receipts
  socket.on("message:read", (data) => handleReadReceipt(socket, data));
};

/**
 * Validate if user is a participant in the chat
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>}
 */
const isParticipant = async (chatId, userId) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
    status: 'active'
  });
  return !!chat;
};

/**
 * Handle user disconnection
 * @param {Object} socket - Socket instance
 */
const handleDisconnect = (socket) => {
  const userId = socket.user._id.toString();
  activeUsers.delete(userId);
  socket.broadcast.emit("user:offline", { userId });
};

/**
 * Check rate limiting for message sending
 * @param {string} userId 
 * @returns {boolean}
 */
const checkRateLimit = (userId) => {
  const now = Date.now();
  const userRateLimit = messageRateLimits.get(userId) || {
    count: 0,
    windowStart: now
  };

  if (now - userRateLimit.windowStart > RATE_LIMIT_WINDOW) {
    userRateLimit.count = 1;
    userRateLimit.windowStart = now;
  } else if (userRateLimit.count >= MAX_MESSAGES_PER_WINDOW) {
    return false;
  } else {
    userRateLimit.count++;
  }

  messageRateLimits.set(userId, userRateLimit);
  return true;
};

/**
 * Handle incoming messages
 * @param {Object} socket - Socket instance
 * @param {Object} data - Message data
 */
const handleMessage = async (socket, data) => {
  try {
    const userId = socket.user._id;
    
    // Basic validation
    if (!data.chatId || !data.content) {
      socket.emit("error", {
        message: "Invalid message data",
        code: "INVALID_MESSAGE"
      });
      return;
    }

    // Check rate limiting
    if (!checkRateLimit(userId.toString())) {
      socket.emit("error", {
        message: "Rate limit exceeded. Please wait before sending more messages.",
        code: "RATE_LIMIT_EXCEEDED"
      });
      return;
    }

    // Participant validation
    if (!(await isParticipant(data.chatId, userId))) {
      socket.emit("error", {
        message: "Access denied. You are not a participant in this chat.",
        code: "ACCESS_DENIED"
      });
      return;
    }

    // Get chat
    const chat = await Chat.findById(data.chatId);
    
    // Create message
    const messageData = {
      sender: userId,
      content: data.content.trim(),
      attachments: data.attachments || []
    };

    // Add message to chat
    await chat.addMessage(messageData);

    // Emit message to all participants except sender
    chat.participants.forEach((participant) => {
      if (participant._id.toString() !== userId.toString()) {
        io.to(participant._id.toString()).emit("message:received", {
          chatId: chat._id,
          message: messageData
        });
      }
    });

    // Confirm to sender
    socket.emit("message:sent", {
      chatId: chat._id,
      message: messageData
    });
  } catch (error) {
    socket.emit("error", {
      message: "Failed to send message",
      code: "SEND_FAILED"
    });
  }
};

/**
 * Handle typing status updates
 * @param {Object} socket - Socket instance
 * @param {Object} data - Typing status data
 * @param {boolean} isTyping - Whether user started or stopped typing
 */
const handleTypingStatus = async (socket, data, isTyping) => {
  if (!data.chatId) return;

  // Validate participant before emitting typing status
  if (await isParticipant(data.chatId, socket.user._id)) {
    socket.to(data.chatId).emit("typing:status", {
      chatId: data.chatId,
      userId: socket.user._id,
      isTyping
    });
  }
};

/**
 * Handle message read receipts
 * @param {Object} socket - Socket instance
 * @param {Object} data - Read receipt data
 */
const handleReadReceipt = async (socket, data) => {
  try {
    if (!data.chatId || !data.messageId) return;

    // Validate participant
    if (!(await isParticipant(data.chatId, socket.user._id))) {
      return;
    }

    const chat = await Chat.findById(data.chatId);
    if (!chat) return;

    const message = chat.messages.id(data.messageId);
    if (!message) return;

    if (!message.readBy.includes(socket.user._id)) {
      message.readBy.push(socket.user._id);
      await chat.save();

      // Notify message sender
      io.to(message.sender.toString()).emit("message:read", {
        chatId: chat._id,
        messageId: message._id,
        readBy: socket.user._id
      });
    }
  } catch (error) {
    console.error("Error handling read receipt:", error);
  }
};

/**
 * Create a new chat
 * @param {Object} chatData 
 * @returns {Promise<Chat>}
 */
const createChat = async (chatData) => {
  const { participants, type, name } = chatData;

  // Validate participants
  if (!participants || participants.length < 2) {
    throw new ApiError("At least 2 participants required", StatusCodes.BAD_REQUEST);
  }

  // Check if direct chat already exists
  if (type === 'direct' && participants.length === 2) {
    const existingChat = await Chat.getChatByParticipants(participants);
    if (existingChat) {
      return existingChat;
    }
  }

  // Create new chat
  const chat = await Chat.create({
    participants,
    type,
    name,
    admin: type === 'group' ? chatData.admin : undefined
  });

  return chat;
};

/**
 * Get chats for a user
 * @param {string} userId 
 * @returns {Promise<Chat[]>}
 */
const getUserChats = async (userId) => {
  return Chat.find({
    participants: userId,
    status: 'active'
  }).sort({ updatedAt: -1 });
};

/**
 * Get chat by ID
 * @param {string} chatId 
 * @param {string} userId 
 * @returns {Promise<Chat>}
 */
const getChatById = async (chatId, userId) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId,
    status: 'active'
  });

  if (!chat) {
    throw new ApiError("Chat not found", StatusCodes.NOT_FOUND);
  }

  return chat;
};

/**
 * Archive a chat
 * @param {string} chatId 
 * @param {string} userId 
 * @returns {Promise<Chat>}
 */
const archiveChat = async (chatId, userId) => {
  const chat = await Chat.findOne({
    _id: chatId,
    participants: userId
  });

  if (!chat) {
    throw new ApiError("Chat not found", StatusCodes.NOT_FOUND);
  }

  chat.status = 'archived';
  await chat.save();

  return chat;
};

/**
 * Delete chat attachments
 * @param {string} chatId 
 */
const deleteChatAttachments = async (chatId) => {
  const chat = await Chat.findById(chatId);
  if (!chat) return;

  // Delete all attachments
  for (const message of chat.messages) {
    for (const attachment of message.attachments) {
      if (attachment.public_id) {
        await deleteFile(attachment.public_id);
      }
    }
  }
};

module.exports = {
  initializeSocketIO,
  createChat,
  getUserChats,
  getChatById,
  archiveChat,
  deleteChatAttachments,
  // Export for testing
  activeUsers,
  messageRateLimits
};
