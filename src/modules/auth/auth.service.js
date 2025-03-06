const { StatusCodes } = require("http-status-codes");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");
const emailService = require("../shared/services/email.service");
const userService = require("../user/user.service");
const otpService = require("../shared/services/otp.service");

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError("Incorrect email or password", StatusCodes.UNAUTHORIZED);
  }
  if (!user.isEmailVerified) {
    throw new ApiError(
      "Please verify your email to login",
      StatusCodes.FORBIDDEN
    );
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto.url,
    profileCompleted: user.profileCompleted,
  };
};

const sendEmailVerification = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }
  const otpObj = await otpService.createEmailVerificationOTPObj(user);
  emailService.sendEmailVerificationRequest(user.email, otpObj);
  return true;
};

const verifyEmail = async ({ email, otp }) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  }
  if (user.isEmailVerified) {
    throw new ApiError("Email already verified", StatusCodes.BAD_REQUEST);
  }
  await user.verifyEmail(otp);
  await otpService.clearEmailVerificationOTP(user);
  emailService.sendEmailVerificationSuccess(user.email);
  return true;
};

const requestEmailVerification = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (user.isEmailVerified) {
    throw new ApiError("Email already verified", StatusCodes.BAD_REQUEST);
  }
  const otpObj = otpService.createEmailVerificationOTPObj(user);
  emailService.sendEmailVerificationRequest(user.email, otpObj);
  return true;
};

const requestPasswordReset = async (email) => {
  const user = await userService.getUserByEmail(email);
  const otpObj = await otpService.createPasswordResetOTPObj(user);
  emailService.sendPasswordResetRequest(email, otpObj);
  return true;
};

const verifyResetPasswordOtp = async ({ email, otp }) => {
  const user = await userService.getUserByEmail(email);
  await otpService.verifyPasswordResetOTP(user, otp);
  await otpService.clearPasswordResetOTP(user);
  return true;
};

const resetPassword = async ({ email, newPassword, otp }) => {
  const user = await User.findOne({
    email,
    passwordResetOtp: otp,
  });
  if (!user || !(Date.now() < user.passwordResetOtpExpiry)) {
    throw new ApiError("OTP not valid for this user", StatusCodes.BAD_REQUEST);
  }
  await userService.resetUserPassword(user, newPassword);
  emailService.sendPasswordResetSuccess(email);
  return true;
};

module.exports = {
  login,
  sendEmailVerification,
  verifyEmail,
  verifyResetPasswordOtp,
  requestPasswordReset,
  resetPassword,
  requestEmailVerification,
};
