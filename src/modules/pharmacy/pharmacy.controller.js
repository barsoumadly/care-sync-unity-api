const Pharmacy = require("../../models/Pharmacy");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");
const slugify = require("slugify");

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
  const slug = slugify(`${req.body.name} laboratory`, {
    lowercase: true,
  });
  req.body.slug = slug;

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

const getPharmacyList = AsyncHandler(async (req, res) => {
  const pharmacyList = await Pharmacy.find();
  if (!pharmacyList) {
    throw new ApiError("No pharmacies found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: pharmacyList });
});

const getPharmacy = AsyncHandler(async (req, res) => {
  const { pharmacyId } = req.params;

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    throw new ApiError("No pharmacy found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: pharmacy });
});

module.exports = {
  getPharmacyProfile,
  updatePharmacyProfile,
  getPharmacyList,
  getPharmacy,
};
