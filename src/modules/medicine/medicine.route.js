const { Router } = require("express");
const {
  getMedicineList,
  addMedicine,
  updateMedicine,
} = require("./medicine.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/", auth, getMedicineList);
router.post("/", auth, addMedicine);
router.put("/", auth, updateMedicine);

module.exports = router;
