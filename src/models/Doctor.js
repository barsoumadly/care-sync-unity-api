const mongoose = require("mongoose");
const doctorSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
    },
    experience: {
      type: Number,
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
const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;
