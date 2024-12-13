const { Router } = require("express");
const authRoute = require("./auth.route");

const router = Router();

router.use("/auth", authRoute);

module.exports = router;
