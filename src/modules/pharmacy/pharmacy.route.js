const { Router } = require("express");
const {
  getPharmacyProfile,
  updatePharmacyProfile,
} = require("./pharmacy.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/profile", auth, getPharmacyProfile);
router.put("/profile", auth, updatePharmacyProfile);

module.exports = router;
