const AsyncHandler = require("../../utils/AsyncHandler");
const userService = require("../user/user.service");
const authService = require("./auth.service");
const { StatusCodes } = require("http-status-codes");
const tokenService = require("../shared/services/token.service");

const register = AsyncHandler(async (req, res) => {
  const newUser = await userService.createUser(req.body);
  await authService.sendEmailVerification(newUser._id);
  res
    .json({
      message:
        "User created successfully. Please check your email for verification OTP.",
    })
    .status(StatusCodes.CREATED);
});

const login = AsyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = await tokenService.generateAuthToken({ userId: user.id });
  res
    .json({
      user,
      password: undefined,
      token,
    })
    .status(StatusCodes.OK);
});

const verifyEmail = AsyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyEmail({ email, otp });
  res.json({ message: "Email verified successfully" }).status(StatusCodes.OK);
});

const requestPasswordReset = AsyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.requestPasswordReset(email);
  res
    .json({
      message: "Password reset OTP has been sent to your email",
    })
    .status(StatusCodes.OK);
});

const requestEmailVerification = AsyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.requestEmailVerification(email);
  res
    .json({
      message: "Email verification OTP has been sent to your email",
    })
    .status(StatusCodes.OK);
});

const verifyResetOtp = AsyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  await authService.verifyResetPasswordOtp({ email, otp });
  res
    .json({
      message: "Valid OTP",
    })
    .status(StatusCodes.OK);
});

const resetPassword = AsyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  await authService.resetPassword({ email, newPassword });
  res
    .json({
      message: "Password has been reset successfully",
    })
    .status(StatusCodes.OK);
});
const getMyProfile = AsyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePhoto: user.profilePhoto?.url,
      profileCompleted: user.profileCompleted,
    },
  });
});

module.exports = {
  register,
  login,
  verifyEmail,
  verifyResetOtp,
  requestEmailVerification,
  requestPasswordReset,
  resetPassword,
  getMyProfile,
};
