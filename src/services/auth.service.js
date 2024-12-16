const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const tokenService = require("./token.service");
const emailService = require("./email.service");

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError("Incorrect email or password", StatusCodes.UNAUTHORIZED);
  }
  return user;
};

const verifyEmail = async (token) => {
  const { userId } = await tokenService.decodeEmailVerificationToken(token);
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }
  if (user.isEmailVerified) {
    throw new ApiError("Email already verified", StatusCodes.BAD_REQUEST);
  }
  await user.verifyEmail();
  emailService.sendEmailVerificationSuccess(user.email);
};

module.exports = { login, verifyEmail };
