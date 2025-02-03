const mongoose = require("mongoose");

// TODO: Define the schema for the facility model
const facilitySchema = mongoose.Schema();

const Facility = mongoose.model("Facility", facilitySchema);

module.exports = Facility;
