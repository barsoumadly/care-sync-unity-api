const mongoose = require("mongoose");

const clinicSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
        index: true,
      },
      state: {
        type: String,
      },
    },
    phone: {
      type: String,
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);
const Clinic = mongoose.model("Clinic", clinicSchema);
module.exports = Clinic;
