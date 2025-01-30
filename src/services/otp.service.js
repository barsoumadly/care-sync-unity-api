const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createOTP = async (user) => {
  const otp = generateOTP();
  user.passwordResetOtp = otp;
  user.passwordResetOtpExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  await user.save();
  return otp;
};

const verifyOTP = async (user, otp) => {
  if (
    !user.passwordResetOtp ||
    user.passwordResetOtp !== otp ||
    user.passwordResetOtpExpiry < new Date()
  ) {
    throw new ApiError("Invalid or expired OTP", StatusCodes.BAD_REQUEST);
  }
  return true;
};

const clearOTP = async (user) => {
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpiry = undefined;
  await user.save();
};

module.exports = {
  createOTP,
  verifyOTP,
  clearOTP,
};
