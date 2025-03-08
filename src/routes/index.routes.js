const { Router } = require("express");
const authRoute = require("../modules/auth/auth.route");
const userRoute = require("../modules/user/user.route");
const facilityRoute = require("../modules/facility/facility.route");
const appointmentRoute = require("../modules/appointment/appointment.route");
const chatRoute = require("../modules/chat/chat.route");
const patientRoute = require("../modules/patient/patient.route");
const doctorRoute = require("../modules/doctor/doctor.route");

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/facilities", facilityRoute);
router.use("/appointments", appointmentRoute);
router.use("/chats", chatRoute);
router.use("/patients", patientRoute);
router.use("/doctors", doctorRoute);

module.exports = router;
