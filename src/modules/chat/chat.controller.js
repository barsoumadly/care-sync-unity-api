const { StatusCodes } = require("http-status-codes");
const AsyncHandler = require("../../utils/AsyncHandler");
const chatService = require("./chat.service");
const ApiError = require("../../utils/ApiError");

/**
 * Create a new chat
 * @route POST /api/chats
 */
const createChat = AsyncHandler(async (req, res) => {
  const chatData = {
    ...req.body,
    participants: [...req.body.participants, req.user._id]
  };

  const chat = await chatService.createChat(chatData);
  res.status(StatusCodes.CREATED).json({
    status: "success",
    data: { chat }
  });
});

/**
 * Get all chats for current user
 * @route GET /api/chats
 */
const getUserChats = AsyncHandler(async (req, res) => {
  const chats = await chatService.getUserChats(req.user._id);
  res.status(StatusCodes.OK).json({
    status: "success",
    data: { chats }
  });
});

/**
 * Get chat by ID
 * @route GET /api/chats/:chatId
 */
const getChatById = AsyncHandler(async (req, res) => {
  const chat = await chatService.getChatById(req.params.chatId, req.user._id);
  res.status(StatusCodes.OK).json({
    status: "success",
    data: { chat }
  });
});

/**
 * Archive a chat
 * @route PATCH /api/chats/:chatId/archive
 */
const archiveChat = AsyncHandler(async (req, res) => {
  const chat = await chatService.archiveChat(req.params.chatId, req.user._id);
  res.status(StatusCodes.OK).json({
    status: "success",
    data: { chat }
  });
});

/**
 * Upload chat attachment
 * @route POST /api/chats/:chatId/attachments
 */
const uploadAttachment = AsyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError("No file uploaded", StatusCodes.BAD_REQUEST);
  }

  const chat = await chatService.getChatById(req.params.chatId, req.user._id);
  
  // File details are added by multer and cloudinary middleware
  const attachmentData = {
    url: req.file.path,
    public_id: req.file.filename,
    type: req.file.mimetype.startsWith('image/') ? 'image' : 'document'
  };

  res.status(StatusCodes.OK).json({
    status: "success",
    data: { attachment: attachmentData }
  });
});

module.exports = {
  createChat,
  getUserChats,
  getChatById,
  archiveChat,
  uploadAttachment
};
