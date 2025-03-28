const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  duration: { type: String },
  dosages: { type: String },
  intakeMethod: { type: String },
  notes: { type: String },
});

const analysisSchema = new mongoose.Schema({
  name: { type: String, required: true },
  notes: { type: String },
});

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clinicName: { type: String, required: true },
  doctorName: { type: String, required: true },
  specialization: { type: String },
  date: { type: String, required: true },
  medicines: [medicineSchema],
  analyses: [analysisSchema],
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);

module.exports = Prescription;
