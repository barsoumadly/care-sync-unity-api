const { Router } = require("express");
const { getPatientProfile } = require("./patient.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/profile", auth, getPatientProfile);

module.exports = router;
