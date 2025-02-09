const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../../utils/ApiError");
const { otp: otpConfig } = require("../../../config/envVariables");
const ms = require("ms");

const generateOTP = () => {
  const min = Math.pow(10, otpConfig.DIGIT - 1);
  const max = Math.pow(10, otpConfig.DIGIT) - 1;
  return Math.floor(min + Math.random() * (max - min)).toString();
};

const createEmailVerificationOTPObj = async (user) => {
  const otp = generateOTP();
  user.emailVerificationOtp = otp;
  user.emailVerificationOtpExpiry = new Date(
    Date.now() + ms(otpConfig.PASSWORD_RESET_EXPIRE_TIME)
  );
  await user.save();
  return { otp, expiryTime: ms(otpConfig.PASSWORD_RESET_EXPIRE_TIME) / 60000 };
};

const createPasswordResetOTPObj = async (user) => {
  const otp = generateOTP();
  user.passwordResetOtp = otp;
  user.passwordResetOtpExpiry = new Date(
    Date.now() + ms(otpConfig.PASSWORD_RESET_EXPIRE_TIME)
  );
  await user.save();
  return { otp, expiryTime: ms(otpConfig.PASSWORD_RESET_EXPIRE_TIME) / 60000 };
};

const verifyPasswordResetOTP = async (user, otp) => {
  if (
    !user.passwordResetOtp ||
    user.passwordResetOtp !== otp ||
    user.passwordResetOtpExpiry < new Date()
  ) {
    throw new ApiError("Invalid or expired OTP", StatusCodes.BAD_REQUEST);
  }
  return true;
};

const clearPasswordResetOTP = async (user) => {
  user.passwordResetOtp = undefined;
  user.passwordResetOtpExpiry = undefined;
  await user.save();
};

const clearEmailVerificationOTP = async (user) => {
  user.emailVerificationOtp = undefined;
  user.emailVerificationOtpExpiry = undefined;
  await user.save();
};

module.exports = {
  createEmailVerificationOTPObj,
  createPasswordResetOTPObj,
  verifyPasswordResetOTP,
  clearPasswordResetOTP,
  clearEmailVerificationOTP,
};
