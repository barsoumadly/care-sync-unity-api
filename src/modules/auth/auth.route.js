const authController = require("./auth.controller");
const auth = require("../../middlewares/auth");
const { Router } = require("express");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/verify-email", authController.verifyEmail);
router.post(
  "/request-email-verification",
  authController.requestEmailVerification
);
router.post("/request-password-reset", authController.requestPasswordReset);
router.post("/verify-reset-otp", authController.verifyResetOtp);
router.post("/reset-password", authController.resetPassword);
router.get("/profile", auth, authController.getMyProfile);

module.exports = router;
