const AsyncHandler = require("../utils/AsyncHandler");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const { StatusCodes } = require("http-status-codes");
const emailService = require("../services/email.service");
const tokenService = require("../services/token.service");
const urlGenerator = require("../helpers/urlGenerator");

const register = AsyncHandler(async (req, res) => {
  const newUser = await userService.createUser(req.body);
  const emailVerificationToken =
    await tokenService.generateEmailVerificationToken({
      userId: newUser._id,
    });
  verificationLink = urlGenerator(
    req,
    `verify-email?token=${emailVerificationToken}`
  );
  emailService.sendEmailVerificationRequest(newUser.email, verificationLink);
  res
    .json({ message: "User created successfully" })
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
  const { token } = req.query;
  await authService.verifyEmail(token);
  res.json({ message: "Email verified successfully" }).status(StatusCodes.OK);
});

const requestPasswordReset = AsyncHandler(async (req, res) => {
  const { email } = req.body;
  await authService.requestPasswordReset(email);
  res.json({ 
    message: "Password reset OTP has been sent to your email" 
  }).status(StatusCodes.OK);
});

const resetPassword = AsyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  await authService.resetPassword({ email, otp, newPassword });
  res.json({ 
    message: "Password has been reset successfully" 
  }).status(StatusCodes.OK);
});

module.exports = { register, login, verifyEmail, requestPasswordReset, resetPassword };
