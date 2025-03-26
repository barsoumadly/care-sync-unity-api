const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    specialization: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["consultation", "follow-up", "emergency"],
      default: "consultation",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "declined", "no-show"],
      default: "pending",
    },
    reasonForVisit: {
      type: String,
    },
    notes: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    paymentType: {
      type: String,
      enum: ["cash", "credit", "insurance", "free", "other"],
      default: "cash",
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient querying
appointmentSchema.index({ doctorId: 1, scheduledAt: 1 });
appointmentSchema.index({ patientId: 1, scheduledAt: 1 });
appointmentSchema.index({ clinicId: 1, scheduledAt: 1 });

const Appointment = mongoose.model("Appointment", appointmentSchema);
module.exports = Appointment;
