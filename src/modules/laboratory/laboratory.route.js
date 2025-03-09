const { Router } = require("express");
const {
  getLaboratoryProfile,
  updateLaboratoryProfile,
} = require("./laboratory.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/profile", auth, getLaboratoryProfile);
router.put("/profile", auth, updateLaboratoryProfile);

module.exports = router;
