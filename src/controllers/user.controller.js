const AsyncHandler = require("../utils/AsyncHandler");
const userService = require("../services/user.service");
const { StatusCodes } = require("http-status-codes");

const updateProfilePhoto = AsyncHandler(async (req, res) => {
  const user = await userService.updateProfilePhoto(req.user.id, req.file);
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Profile photo updated successfully",
  });
});

const removeProfilePhoto = AsyncHandler(async (req, res) => {
  const user = await userService.removeProfilePhoto(req.user.id);
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Profile photo removed successfully",
  });
});

module.exports = {
  updateProfilePhoto,
  removeProfilePhoto,
};
