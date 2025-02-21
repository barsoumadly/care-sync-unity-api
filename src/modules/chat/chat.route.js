const chatController = require("./chat.controller");
const { Router } = require("express");
const auth = require('../../middlewares/auth');

const router = Router();

// Protect all chat routes
router.use(auth.protect);

// Create new chat
router.post('/', chatController.createChat);

// Get chat history
router.get('/:chatId/messages', chatController.getChatHistory);

// Get user's chats
router.get('/', chatController.getUserChats);

module.exports = router;
