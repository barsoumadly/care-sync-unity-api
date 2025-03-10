const { Router } = require("express");
const {
  getLaboratoryProfile,
  updateLaboratoryProfile,
  getLaboratoryList,
  getLaboratory,
} = require("./laboratory.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/profile", auth, getLaboratoryProfile);
router.put("/profile", auth, updateLaboratoryProfile);
router.get("/", auth, getLaboratoryList);
router.get("/:laboratoryId", auth, getLaboratory);

module.exports = router;
