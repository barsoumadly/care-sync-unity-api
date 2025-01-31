const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");
const User = require("../models/User");
const AsyncHandler = require("../utils/AsyncHandler");
const tokenService = require("../services/token.service");

const auth = AsyncHandler(async (req, res, next) => {
  // Get token from header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError("Access denied. No token provided.", StatusCodes.UNAUTHORIZED);
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verify and decode token
    const decoded = await tokenService.decodeAuthToken(token);
    
    // Get user from token
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError("User associated with this token no longer exists", StatusCodes.NOT_FOUND);
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError("Invalid or expired authentication token", StatusCodes.UNAUTHORIZED);
  }
});

module.exports = auth;
