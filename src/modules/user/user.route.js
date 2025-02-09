const express = require("express");
const { upload } = require("../../config/cloudinary");
const userController = require("./user.controller");
const auth = require("../../middlewares/auth");

const router = express.Router();

router
  .route("/profile-photo")
  .put(auth, upload.single("photo"), userController.updateProfilePhoto)
  .delete(auth, userController.removeProfilePhoto);

module.exports = router;
