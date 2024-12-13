const AsyncHandler = require("../utils/AsyncHandler");
const userService = require("../services/user.service");
const authServicve = require("../services/auth.service");
const { StatusCodes } = require("http-status-codes");
const tokenUtils = require("../utils/Token");

const register = AsyncHandler(async (req, res) => {
  await userService.createUser(req.body);
  res
    .json({ message: "User created successfully" })
    .status(StatusCodes.CREATED);
});

const login = AsyncHandler(async (req, res) => {
  const user = await authServicve.login(req.body);
  const token = await tokenUtils.createToken(user);
  res.json({ token }).status(StatusCodes.OK);
});

module.exports = { register, login };
