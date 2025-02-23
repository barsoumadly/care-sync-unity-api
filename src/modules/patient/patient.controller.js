const Patient = require("../models/Patient");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");
const AsyncHandler = require("../utils/AsyncHandler");

const getPatientProfile = AsyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ userId: req.user._id }).populate("userId", "name email");
  if (!patient) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: patient });
});

module.exports = { getPatientProfile };
