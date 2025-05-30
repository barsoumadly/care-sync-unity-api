const { Router } = require("express");

const router = Router();

const auth = require("../../middlewares/auth");
const {
  createPrescription,
  getPrescriptionsByPatientId,
  updatePrescription,
  getPrescriptionsList,
} = require("./prescription.controller");

router.post("/", auth, createPrescription);
router.put("/:id", auth, updatePrescription);
router.get("/", auth, getPrescriptionsByPatientId);
router.get("/:id", getPrescriptionsList);

module.exports = router;
