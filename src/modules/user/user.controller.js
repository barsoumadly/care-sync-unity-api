const AsyncHandler = require("../../utils/AsyncHandler");
const userService = require("./user.service");
const { StatusCodes } = require("http-status-codes");

const updateProfilePhoto = AsyncHandler(async (req, res) => {
  const user = await userService.updateProfilePhoto(req.user.id, req.file);
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Profile photo updated successfully",
    data: {
      profilePhoto: user.profilePhoto.url,
    },
  });
});

const removeProfilePhoto = AsyncHandler(async (req, res) => {
  await userService.removeProfilePhoto(req.user.id);
  res.status(StatusCodes.OK).json({
    status: "success",
    message: "Profile photo removed successfully",
  });
});

const getUser = AsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await userService.getUserById(userId);
  if (!user) {
    throw new ApiError("No user found with this id", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: user });
});

module.exports = {
  updateProfilePhoto,
  removeProfilePhoto,
  getUser,
};
