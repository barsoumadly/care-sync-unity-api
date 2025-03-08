const { Router } = require("express");
const doctorController = require("./doctor.controller"); // Controller Layer
const auth = require("../../middlewares/auth");

const router = Router();
router.get("/profile", auth, doctorController.getProfile); // Get doctor's profile
router.put("/profile", auth, doctorController.updateProfile); // Update profile
router.get("/patients", auth, doctorController.listPatients); // List patients under doctor
router.get("/appointments", auth, doctorController.listAppointments); // List doctor's appointments
router.get("/appointments/:id", auth, doctorController.getAppointment); // Get specific appointment
router.put("/appointments/:id", auth, doctorController.updateAppointment); // Update appointment details
router.get("/clinics", auth, doctorController.listClinics); // List doctor's clinics

module.exports = router;
