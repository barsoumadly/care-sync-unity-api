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

const updateMedicine = AsyncHandler(async (req, res) => {
  const pharmacyId = req.user._id;
  const { medicineId, medicineData } = req.body;

  const medicineDocument = await Medicine.findOne({ pharmacyId });

  if (!medicineDocument) {
    return res
      .status(404)
      .json({ message: "Medicines not found for this pharmacy" });
  }

  const medicine = medicineDocument.medicines.find(
    (medicine) => medicine.id === medicineId
  );

  if (!medicine) {
    return res.status(404).json({ message: "Medicine not found" });
  }

  medicine.name = medicineData.name;
  medicine.quantity = medicineData.quantity;
  medicine.expirationDate = medicineData.expirationDate;
  medicine.price = medicineData.price;

  await medicineDocument.save();

  res.status(200).json({
    message: "Medicine details updated successfully",
    data: medicineDocument,
  });
});

const deleteMedicine = AsyncHandler(async (req, res) => {
  const pharmacyId = req.user._id;
  const { id: medicineId } = req.params;

  console.log(medicineId);

  const medicineDocument = await Medicine.findOne({ pharmacyId });

  if (!medicineDocument) {
    return res
      .status(404)
      .json({ message: "Medicines not found for this pharmacy" });
  }

  const medicineIndex = medicineDocument.medicines.findIndex(
    (medicine) => medicine.id === medicineId
  );

  if (medicineIndex === -1) {
    return res.status(404).json({ message: "Medicine not found" });
  }

  medicineDocument.medicines.splice(medicineIndex, 1);

  await medicineDocument.save();

  res
    .status(200)
    .json({ message: "Medicine deleted successfully", data: medicineDocument });
});

module.exports = {
  getMedicineList,
  addMedicine,
  updateMedicine,
  deleteMedicine,
};
