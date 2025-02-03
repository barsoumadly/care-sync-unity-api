const mongoose = require("mongoose");

// TODO: Define the schema for the appointment model
const appointmentSchema = mongoose.Schema();

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
