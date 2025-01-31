const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");
const { otp: otpConfig } = require("../config/envVariables");
const ms = require("ms");

const generateOTP = () => {
  const min = Math.pow(10, otpConfig.DIGIT - 1);
  const max = Math.pow(10, otpConfig.DIGIT) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

const createPasswordResetOTPObj = async (user) => {
  const otp = generateOTP();
  user.passwordResetOtp = otp;
  user.passwordResetOtpExpiry = new Date(
    Date.now() + ms(otpConfig.PASSWORD_RESET_EXPIRE_TIME)
  );
  await user.save();
  return { otp, expiryTime: user.passwordResetOtpExpiry };
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
  createPasswordResetOTPObj,
  verifyOTP,
  clearOTP,
};
