const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const { deleteFile } = require("../../modules/shared/services/file.service");

/**
 * Create a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (user) => {
  if (await User.isEmailTaken(user.email)) {
    throw new ApiError("Email already taken", StatusCodes.BAD_REQUEST);
  }
  return User.create(user);
};

/**
 * Get user by id
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  return User.findById(id);
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError("No user found with this email", StatusCodes.NOT_FOUND);
  }
  return user;
};

/**
 * Reset user password
 * @param {Object} user
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
const resetUserPassword = async (user, newPassword) => {
  user.password = newPassword;
  await user.save();
};

/**
 * Update user profile photo
 * @param {string} userId
 * @param {Express.Multer.File} file
 * @returns {Promise<User>}
 */
const updateProfilePhoto = async (userId, file) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }

  // If user has existing photo, delete it
  if (user.profilePhoto?.public_id) {
    await deleteFile(user.profilePhoto.public_id);
  }

  // Update user with new photo details
  user.profilePhoto = {
    url: file.path,
    public_id: file.filename,
  };
  await user.save();

  return user;
};

/**
 * Remove user profile photo
 * @param {string} userId
 * @returns {Promise<User>}
 */
const removeProfilePhoto = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }

  if (user.profilePhoto?.public_id) {
    await deleteFile(user.profilePhoto.public_id);
    user.profilePhoto = undefined;
    await user.save();
  }

  return user;
};

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  resetUserPassword,
  updateProfilePhoto,
  removeProfilePhoto,
};
