const Pharmacy = require("../../models/Pharmacy");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");

const getPharmacyProfile = AsyncHandler(async (req, res) => {
  let pharmacy = await Pharmacy.findOne({ userId: req.user._id }).populate(
    "userId",
    "name email"
  );
  if (!pharmacy) {
    pharmacy = await Pharmacy.findOneAndUpdate(
      { userId: req.user._id },
      {},
      { new: true, runValidators: true, upsert: true }
    ).populate("userId", "name email");
  }
  if (!pharmacy) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: pharmacy });
});

const updatePharmacyProfile = AsyncHandler(async (req, res) => {
  const pharmacy = await Pharmacy.findOneAndUpdate(
    { userId: req.user._id },
    req.body,
    { new: true, runValidators: true, upsert: true }
  ).populate("userId", "name email profilePhoto.url");
  if (!pharmacy) {
    throw new ApiError("Patient profile not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: pharmacy });
});

module.exports = {
  getPharmacyProfile,
  updatePharmacyProfile,
};
