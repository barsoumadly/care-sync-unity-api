const mongoose = require("mongoose");

const patientSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    phone: {
      type: String,
    },
    address: {
      city: {
        type: String,
      },
      area: {
        type: String,
      },
      address: {
        type: String,
      },
    },
    bloodGroup: {
      type: String,
    },
    medicalHistory: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
