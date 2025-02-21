const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const { upload } = require("../../config/cloudinary");
const chatController = require("./chat.controller");

// Protect all routes
router.use(auth);

// Chat routes
router
  .route("/")
  .post(chatController.createChat)
  .get(chatController.getUserChats);

router.route("/:chatId").get(chatController.getChatById);

router.route("/:chatId/archive").patch(chatController.archiveChat);

router
  .route("/:chatId/attachments")
  .post(upload.single("file"), chatController.uploadAttachment);

module.exports = router;
