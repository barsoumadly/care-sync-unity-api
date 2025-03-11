const Medicine = require("../../models/Medicine");
const AsyncHandler = require("../../utils/AsyncHandler");
const User = require("../../models/User");

const getMedicineList = AsyncHandler(async (req, res) => {
  const pharmacyId = req.user._id;

  const pharmacy = await User.findById(pharmacyId);
  if (!pharmacy) {
    return res.status(404).json({ message: "Pharmacy not found" });
  }

  const medicines = await Medicine.findOne({ pharmacyId: pharmacyId });

  if (!medicines) {
    return res
      .status(404)
      .json({ message: "Medicines not found for this pharmacy" });
  }

  res.status(200).json(medicines);
});

const addMedicine = AsyncHandler(async (req, res) => {
  const pharmacyId = req.user._id;
  const medicines = req.body;
  const pharmacy = await User.findById(pharmacyId);

  if (!pharmacy) {
    return res.status(404).json({ message: "Pharmacy not found" });
  }

  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({ message: "Medicines array is required" });
  }

  for (const medicine of medicines) {
    if (
      !medicine.name ||
      !medicine.quantity ||
      !medicine.price ||
      !medicine.expirationDate
    ) {
      return res.status(400).json({ message: "Invalid medicine data" });
    }
  }

  let medicineDocument = await Medicine.findOne({ pharmacyId });
  if (!medicineDocument) {
    medicineDocument = new Medicine({ pharmacyId, medicines: [] });
  }

  medicineDocument.medicines.push(...medicines);

  await medicineDocument.save();

  res.status(201).json({
    message: "Medicines added successfully",
    data: medicineDocument,
  });
});

module.exports = {
  getMedicineList,
  addMedicine,
};
