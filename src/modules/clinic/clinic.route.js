const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const clinicAuth = require("../../middlewares/clinicAuth");
const clinicController = require("./clinic.controller");
const { uploadClinicPhotos } = require("../../config/cloudinary");

router.get("/", clinicController.getClinics);
router.get("/:id", clinicController.getClinicById);
router.put(
  "/",
  auth,
  clinicAuth,
  uploadClinicPhotos.array("photos", 10),
  clinicController.updateClinic
);
router.get(
  "/appointments",
  auth,
  clinicAuth,
  clinicController.getClinicAppointments
);

module.exports = router;
