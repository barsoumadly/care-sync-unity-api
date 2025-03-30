const { Router } = require("express");
const doctorController = require("./doctor.controller"); // Controller Layer
const auth = require("../../middlewares/auth");
const doctorAuth = require("../../middlewares/doctorAuth");

const router = Router();

// Apply both auth and doctorAuth to all doctor-specific routes
router.get("/profile", auth, doctorAuth, doctorController.getProfile); // Get doctor's profile
router.put("/profile", auth, doctorAuth, doctorController.updateProfile); // Update profile
router.get("/patients", auth, doctorAuth, doctorController.listPatients); // List patients under doctor
router.get(
  "/appointments",
  auth,
  doctorAuth,
  doctorController.listAppointments
); // List doctor's appointments
router.get(
  "/appointments/clinic/:clinicId",
  auth,
  doctorAuth,
  doctorController.getAppointmentsByClinic
); // Get appointments by clinic ID
router.get(
  "/appointments/:id",
  auth,
  doctorAuth,
  doctorController.getAppointment
); // Get specific appointment
router.put(
  "/appointments/:id",
  auth,
  doctorAuth,
  doctorController.updateAppointment
); // Update appointment details
router.get("/clinics", auth, doctorAuth, doctorController.listClinics); // List doctor's clinics
router.get(
  "/my-clinics",
  auth,
  doctorAuth,
  doctorController.getMyClinicDetails
); // Get details of clinics where doctor works
router.get("/schedule", auth, doctorAuth, doctorController.getSchedule); // Get doctor's schedule
router.get("/:doctorId", auth, doctorController.getDoctorById); // Get doctor by id

module.exports = router;
