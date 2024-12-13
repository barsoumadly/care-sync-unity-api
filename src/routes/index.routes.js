const { Router } = require("express");
const userRoutes = require("./auth.route");

const router = Router();

router.use("/auth", authRoutes);

module.exports = router;
