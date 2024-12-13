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

module.exports = { createUser };
