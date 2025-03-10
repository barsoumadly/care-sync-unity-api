const { Router } = require("express");
const {
  getPharmacyProfile,
  updatePharmacyProfile,
  getPharmacyList,
  getPharmacy,
} = require("./pharmacy.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/profile", auth, getPharmacyProfile);
router.put("/profile", auth, updatePharmacyProfile);
router.get("/", auth, getPharmacyList);
router.get("/:pharmacyId", auth, getPharmacy);

module.exports = router;
