const AsyncHandler = require("../utils/AsyncHandler");
const userService = require("../services/user.service");
const authService = require("../services/auth.service");
const { StatusCodes } = require("http-status-codes");
const emailService = require("../services/email.service");
const tokenService = require("../services/token.service");
const urlGenerator = require("../helpers/urlGenerator");

const register = AsyncHandler(async (req, res) => {
  const newUser = await userService.createUser(req.body);
  const token = await tokenService.generateEmailVerificationToken({
    userId: newUser._id,
  });
  verificationLink = urlGenerator(req, `verify-email?token=${token}`);
  emailService.sendEmailVerificationRequest(newUser.email, verificationLink);
  res
    .json({ message: "User created successfully" })
    .status(StatusCodes.CREATED);
});

const login = AsyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  const token = await tokenService.generateAuthToken({ userId: user.id });
  res.json({ token }).status(StatusCodes.OK);
});

const verifyEmail = AsyncHandler(async (req, res) => {
  const { token } = req.query;
  await authService.verifyEmail(token);
  res.json({ message: "Email verified successfully" }).status(StatusCodes.OK);
});

module.exports = { register, login, verifyEmail };
