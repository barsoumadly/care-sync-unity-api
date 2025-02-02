const { Router } = require("express");
const authRoute = require("./auth.route");
const userRoute = require("./user.route");

const router = Router();

router.use("/auth", authRoute);
router.use("/users", userRoute);

module.exports = router;
