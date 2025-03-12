const { StatusCodes } = require("http-status-codes");
const ApiError = require("../utils/ApiError");
const Clinic = require("../models/Clinic");
const AsyncHandler = require("../utils/AsyncHandler");

const clinicAuth = AsyncHandler(async (req, _, next) => {
  let clinic = await Clinic.findOne({ adminId: req.user._id });

  if (!clinic) {
    // Verify required fields for new clinic
    if (
      !req.body.name ||
      !req.body.address?.street ||
      !req.body.address?.city ||
      !req.body.phone
    ) {
      throw new ApiError(
        "Missing required fields. Please provide: name, address (street, city), and phone",
        StatusCodes.BAD_REQUEST
      );
    }

    // Create new clinic if it doesn't exist
    clinic = await Clinic.create({
      adminId: req.user._id,
      name: req.body.name,
      address: {
        street: req.body.address.street,
        city: req.body.address.city,
        state: req.body.address?.state || "",
      },
      phone: req.body.phone,
      status: "active",
    });
  }

  // Add clinic to request object
  req.clinic = clinic;
  next();
});

module.exports = clinicAuth;
