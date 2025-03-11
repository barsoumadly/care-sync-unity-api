const { Router } = require("express");
const { getMedicineList, addMedicine } = require("./medicine.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/", auth, getMedicineList);
router.post("/", auth, addMedicine);

module.exports = router;
