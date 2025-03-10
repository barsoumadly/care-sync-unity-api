const Laboratory = require("../../models/Laboratory");
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

const getLaboratoryList = AsyncHandler(async (req, res) => {
  const laboratoryList = await Laboratory.find();
  if (!laboratoryList) {
    throw new ApiError("No laboratories found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: laboratoryList });
});

const getLaboratory = AsyncHandler(async (req, res) => {
  const { laboratoryId } = req.params;

  const laboratory = await Laboratory.findById(laboratoryId);
  if (!laboratory) {
    throw new ApiError("No laboratory found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: laboratory });
});

module.exports = {
  getLaboratoryProfile,
  updateLaboratoryProfile,
  getLaboratoryList,
  getLaboratory,
};
