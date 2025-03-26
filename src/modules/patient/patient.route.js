const { Router } = require("express");
const {
  getPatientProfile,
  updatePatientProfile,
  listDoctors,
  listAppointments,
  bookAppointment,
  getAppointmentDetails,
  rescheduleOrCancelAppointment,
} = require("./patient.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/profile", auth, getPatientProfile);
router.put("/profile", auth, updatePatientProfile);

router.get("/doctors/:clinicId", auth, listDoctors);

router.get("/appointments", auth, listAppointments);
router.post("/appointments", auth, bookAppointment);
router.get("/appointments/:id", auth, getAppointmentDetails);
router.put("/appointments/:id", auth, rescheduleOrCancelAppointment);

module.exports = router;
