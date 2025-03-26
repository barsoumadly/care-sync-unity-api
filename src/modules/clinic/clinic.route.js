const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/auth");
const clinicAuth = require("../../middlewares/clinicAuth");
const clinicController = require("./clinic.controller");
const { uploadClinicPhotos, upload } = require("../../config/cloudinary");

router.get("/", clinicController.getClinics);

router.get(
  "/appointments/doctors-appointments",
  auth,
  clinicAuth,
  clinicController.getDoctorsWithAppointments
);

router.post(
  "/appointments/book",
  auth,
  clinicAuth,
  clinicController.bookAppointment
);

router.put(
  "/",
  uploadClinicPhotos.array("photos", 10),
  auth,
  clinicAuth,
  clinicController.updateClinic
);
router.get(
  "/appointments",
  auth,
  clinicAuth,
  clinicController.getClinicAppointments
);

router.get("/own", auth, clinicAuth, clinicController.getOwnClinic);

router.get("/own-doctors", auth, clinicAuth, clinicController.getOwnDoctors);

// Create doctor in clinic
router.post("/doctors", auth, clinicAuth, clinicController.createDoctor);

// Update doctor
router.put(
  "/doctors/:doctorId",
  auth,
  clinicAuth,
  upload.single("profilePhoto"),
  clinicController.updateDoctor
);

// Get doctor appointments
router.get(
  "/doctors/:doctorId/appointments",
  auth,
  clinicAuth,
  clinicController.getDoctorAppointments
);

// Get doctor appointments with turn numbers
router.get(
  "/doctors/:doctorId/appointments-queue",
  auth,
  clinicAuth,
  clinicController.getDoctorAppointmentsQueue
);

// Update appointment (doctor or schedule)
router.put(
  "/appointments/:appointmentId",
  auth,
  clinicAuth,
  clinicController.updateAppointment
);

router.get("/:id", clinicController.getClinicById);

// Remove doctor from clinic
router.delete(
  "/doctors/:doctorId",
  auth,
  clinicAuth,
  clinicController.removeDoctor
);

module.exports = router;
