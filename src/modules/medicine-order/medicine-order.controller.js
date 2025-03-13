const MedicineOrder = require("../../models/MedicineOrder");
const User = require("../../models/User");
const Pharmacy = require("../../models/Pharmacy");
const AsyncHandler = require("../../utils/AsyncHandler");
const Patient = require("../../models/Patient");

const addMedicineOrder = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { pharmacyId, medicines } = req.body;

  const pharmacy = await Pharmacy.findById(pharmacyId);
  if (!pharmacy) {
    return res.status(404).json({ message: "Pharmacy not found" });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const [patient] = await Patient.find({ userId: userId });

  const userPhoneNumber = patient.phone;
  const userAddress = `${patient.address.address} ${patient.address.area}`;
  const pharmacyName = pharmacy.name;

  const newMedicineOrder = new MedicineOrder({
    pharmacyId,
    userId,
    userPhoneNumber,
    userAddress,
    pharmacyName,
    medicines,
  });

  const savedOrder = await newMedicineOrder.save();
  res.status(201).json(savedOrder);
});

const getMedicineOrdersByUserId = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await MedicineOrder.find({ userId: userId });

  if (!orders || orders.length === 0) {
    return res
      .status(404)
      .json({ message: "No medicine orders found for this user" });
  }

  res.status(200).json(orders);
});

const getMedicineOrderById = AsyncHandler(async (req, res) => {
  const orderId = req.params.id;

  const order = await MedicineOrder.findById(orderId);

  if (!order) {
    return res.status(404).json({ message: "Medicine order not found" });
  }

  res.status(200).json(order);
});

module.exports = {
  addMedicineOrder,
  getMedicineOrdersByUserId,
  getMedicineOrderById,
};
