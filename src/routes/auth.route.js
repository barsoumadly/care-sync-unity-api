const authController = require("../controllers/auth.controller");
const { Router } = require("express");

const router = Router();

router.post("/register", authController.register);
router.get("/login", authController.login);
router.get("/verify-email", authController.verifyEmail);

module.exports = router;
