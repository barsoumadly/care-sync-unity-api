const Doctor = require("../models/Doctor");
const ApiError = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");

/**
 * Middleware to authenticate doctors
 * Adds the doctor profile to the request object as req.doctor
 */
const doctorAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw new ApiError("Authentication required", StatusCodes.UNAUTHORIZED);
    }

    // Check if user has doctor role (case-insensitive)
    if (req.user.role.toUpperCase() !== "DOCTOR") {
      throw new ApiError(
        "Access denied. Doctor privileges required",
        StatusCodes.FORBIDDEN
      );
    }

    // Find the doctor profile
    let doctor = await Doctor.findOne({ userId: req.user._id });

    // If doctor profile doesn't exist, create a new empty one
    if (!doctor) {
      doctor = await Doctor.create({
        userId: req.user._id,
        specialization: "General", // Default value for required field
      });

      // Re-fetch with populated user data
      doctor = await Doctor.findById(doctor._id).populate(
        "userId",
        "_id name email profilePicture"
      );
    }

    // Add the doctor profile to the request object
    req.doctor = doctor;

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      return res
        .status(error.statusCode)
        .json({ success: false, message: error.message });
    }

    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  }
};

module.exports = doctorAuth;
