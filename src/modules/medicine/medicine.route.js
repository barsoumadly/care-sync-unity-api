const { Router } = require("express");
const {
  getMedicineList,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getMedicinesByPharmacy,
} = require("./medicine.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/", auth, getMedicineList);
router.get("/pharmacy/:id", auth, getMedicinesByPharmacy);
router.post("/", auth, addMedicine);
router.put("/", auth, updateMedicine);
router.delete("/:id", auth, deleteMedicine);

module.exports = router;
