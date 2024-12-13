const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Incorrect email or password");
  }
  return user;
};

module.exports = { login };
