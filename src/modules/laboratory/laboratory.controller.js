const Laboratory = require("../../models/Pharmacy");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");

const getLaboratoryProfile = AsyncHandler(async (req, res) => {
  let laboratory = await Laboratory.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email"
  );
  if (!laboratory) {
    laboratory = await Laboratory.findOneAndUpdate(
      { userId: req.user._id },
      {},
      { new: true, runValidators: true, upsert: true }
    ).populate("userId", "name email");
  }
  if (!laboratory) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: laboratory });
});

const updateLaboratoryProfile = AsyncHandler(async (req, res) => {
  const laboratory = await Laboratory.findOneAndUpdate(
    { userId: req.user._id },
    req.body,
    { new: true, runValidators: true, upsert: true }
  ).populate("userId", "name email profilePhoto.url");
  if (!laboratory) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: laboratory });
});

module.exports = {
  getLaboratoryProfile,
  updateLaboratoryProfile,
};
