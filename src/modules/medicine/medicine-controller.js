const Medicine = require("../../models/Medicine");
const { StatusCodes } = require("http-status-codes");
const ApiError = require("../../utils/ApiError");
const AsyncHandler = require("../../utils/AsyncHandler");

const getMedicineList = AsyncHandler(async (req, res) => {
  const medicineList = await Medicine.find();
  if (!medicineList) {
    throw new ApiError("No medicines found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: medicineList });
});

const addMedicine = AsyncHandler(async (req, res) => {
  const medicineList = await Medicine.findOneAndUpdate(
    { pharmacyId: req.user._id },
    req.body,
    { new: true, runValidators: true, upsert: true }
  ).populate("pharmacyId", "name email profilePhoto.url");
  if (!medicineList) {
    throw new ApiError("Pharmacy not found", StatusCodes.NOT_FOUND);
  }
  res.status(StatusCodes.OK).json({ success: true, data: medicineList });
});

export { getMedicineList, addMedicine };
