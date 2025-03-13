const mongoose = require("mongoose");

const medicineOrderSchema = new mongoose.Schema({
  pharmacyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Pharmacy",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userPhoneNumber: {
    type: String,
    required: true,
  },
  userAddress: {
    type: String,
    required: true,
  },
  pharmacyName: {
    type: String,
    required: true,
  },
  medicines: [
    {
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      expirationDate: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "on the way", "delivered", "cancelled"],
    default: "pending",
  },
  paymentType: {
    type: String,
    enum: ["paid", "un paid"],
    default: "un paid",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MedicineOrder = mongoose.model("MedicineOrder", medicineOrderSchema);

module.exports = MedicineOrder;
