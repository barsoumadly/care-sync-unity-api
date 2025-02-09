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
