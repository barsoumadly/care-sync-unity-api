const { Router } = require("express");
const { getPatientProfile } = require("../controllers/patients.controller");
const auth = require("../middlewares/auth");

const router = Router();

router.get("/profile", auth, getPatientProfile);

module.exports = router;
