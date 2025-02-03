const { Router } = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");
const facilityRoute = require("./facility.route");
const appointmentRoute = require("./appointment.route");

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);
router.use("/facilities", facilityRoute);
router.use("/appointments", appointmentRoute);

module.exports = router;
