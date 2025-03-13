const express = require("express");
const router = express.Router();
const medicineOrderController = require("./medicine-order.controller");
const auth = require("../../middlewares/auth");

router.post("/", auth, medicineOrderController.addMedicineOrder);
router.get("/", auth, medicineOrderController.getMedicineOrdersByUserId);
router.get("/:id", auth, medicineOrderController.getMedicineOrderById);

module.exports = router;
