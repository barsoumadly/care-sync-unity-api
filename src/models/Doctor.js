const mongoose = require("mongoose");

// TODO: Define the schema for the doctor model
const doctorSchema = mongoose.Schema();

const Doctor = mongoose.model("Doctor", doctorSchema);

module.exports = Doctor;
