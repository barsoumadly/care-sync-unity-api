const mongoose = require("mongoose");

// TODO: Define the schema for the appointment model
const chatSchema = mongoose.Schema();

const Appointment = mongoose.model("Facility", chatSchema);

module.exports = Appointment;
