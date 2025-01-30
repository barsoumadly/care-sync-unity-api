const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

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

module.exports = { createUser, getUserById, getUserByEmail, resetUserPassword };
