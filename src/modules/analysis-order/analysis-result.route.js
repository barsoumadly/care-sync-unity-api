const { Router } = require("express");
const {
  addAnalysisOrder,
  getAnalysisOrdersByUserId,
  getAnalysisOrderById,
  getAnalysisOrdersByLaboratoryId,
  editAnalysisOrderStatus,
} = require("./analysis-result.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.post("/", auth, addAnalysisOrder);
router.put("/:id", auth, editAnalysisOrderStatus);
router.get("/", auth, getAnalysisOrdersByUserId);
router.get("/laboratory", auth, getAnalysisOrdersByLaboratoryId);
router.get("/:id", auth, getAnalysisOrderById);

module.exports = router;
