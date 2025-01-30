const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const tokenService = require("./token.service");
const emailService = require("./email.service");
const userService = require("./user.service");
const otpService = require("./otp.service");

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

const requestPasswordReset = async (email) => {
  const user = await userService.getUserByEmail(email);
  const otp = await otpService.createOTP(user);
  await emailService.sendPasswordResetRequest(email, otp);
  return true;
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const user = await userService.getUserByEmail(email);
  await otpService.verifyOTP(user, otp);
  await userService.resetUserPassword(user, newPassword);
  await otpService.clearOTP(user);
  await emailService.sendPasswordResetSuccess(email);
  return true;
};

module.exports = { login, verifyEmail, requestPasswordReset, resetPassword };
