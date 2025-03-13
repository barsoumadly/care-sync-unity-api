const express = require("express");
const router = express.Router();
const medicineOrderController = require("./medicine-order.controller");
const auth = require("../../middlewares/auth");

router.get("/", auth, medicineOrderController.getMedicineOrdersByUserId);
router.get("/:id", auth, medicineOrderController.getMedicineOrderById);
router.get(
  "/pharmacy/:id",
  auth,
  medicineOrderController.getMedicineOrdersByPharmacyId
);
router.post("/", auth, medicineOrderController.addMedicineOrder);
router.put("/:id", auth, medicineOrderController.editMedicineOrderStatus);

module.exports = router;
