const { Router } = require("express");
const authRoute = require("../modules/auth/auth.route");
const userRoute = require("../modules/user/user.route");
const facilityRoute = require("../modules/facility/facility.route");
const appointmentRoute = require("../modules/appointment/appointment.route");
const chatRoute = require("../modules/chat/chat.route");

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/facilities", facilityRoute);
router.use("/appointments", appointmentRoute);
router.use("/chats", chatRoute);

module.exports = router;
