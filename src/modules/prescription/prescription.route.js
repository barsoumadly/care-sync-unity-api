const { Router } = require("express");

const router = Router();

const auth = require("../../middlewares/auth");
const {
  createPrescription,
  getPrescriptionsByPatientId,
} = require("./prescription.controller");

router.post("/", auth, createPrescription);
router.get("/", auth, getPrescriptionsByPatientId);

module.exports = router;
