const { Router } = require("express");

const router = Router();

const auth = require("../../middlewares/auth");
const {
  createPrescription,
  getPrescriptionsByPatientId,
  updatePrescription,
} = require("./prescription.controller");

router.post("/", auth, createPrescription);
router.put("/:id", auth, updatePrescription);
router.get("/", auth, getPrescriptionsByPatientId);

module.exports = router;
