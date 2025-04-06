const MedicineOrder = require("../../models/MedicineOrder");
const User = require("../../models/User");
const Pharmacy = require("../../models/Pharmacy");
const AsyncHandler = require("../../utils/AsyncHandler");
const Patient = require("../../models/Patient");

const addMedicineOrder = AsyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { pharmacyId, medicines, paymentType } = req.body.order;

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
    paymentType,
  });

  const savedOrder = await newMedicineOrder.save();
  res.status(201).json(savedOrder);
});

const getMedicineOrdersByUserId = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const orders = await MedicineOrder.find({ userId: userId });

  // if (!orders || orders.length === 0) {
  //   return res
  //     .status(404)
  //     .json({ message: "No medicine orders found for this user" });
  // }

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

const getMedicineOrdersByPharmacyId = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const pharmacyId = await Pharmacy.find({ userId: id });
  const orders = await MedicineOrder.find({ pharmacyId: pharmacyId }).populate(
    "userId"
  );

  // if (!orders || orders.length === 0) {
  //   return res
  //     .status(404)
  //     .json({ message: "No medicine orders found for this pharmacy" });
  // }

  res.status(200).json(orders);
});

const editMedicineOrderStatus = AsyncHandler(async (req, res) => {
  const orderId = req.params.id;
  const { status, paymentType } = req.body;

  if (!["pending", "on the way", "delivered", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status provided" });
  }

  const updatedOrder = await MedicineOrder.findByIdAndUpdate(
    orderId,
    { status: status, paymentType: paymentType ? paymentType : "un paid" },
    { new: true }
  );

  if (!updatedOrder) {
    return res.status(404).json({ message: "Medicine order not found" });
  }

  res.status(200).json(updatedOrder);
});

module.exports = {
  addMedicineOrder,
  getMedicineOrdersByUserId,
  getMedicineOrderById,
  getMedicineOrdersByPharmacyId,
  editMedicineOrderStatus,
};
