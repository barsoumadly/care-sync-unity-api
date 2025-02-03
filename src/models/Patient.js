const mongoose = require("mongoose");

// TODO: Define the schema for the patient model
const patientSchema = mongoose.Schema();

const Patient = mongoose.model("Patient", patientSchema);

module.exports = Patient;
