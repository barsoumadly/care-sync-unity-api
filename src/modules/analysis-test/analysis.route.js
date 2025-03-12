const { Router } = require("express");
const {
  getAnalysisList,
  addAnalyisTest,
  updateAnalysisTest,
  deleteAnalysis,
  getAnalysisListByLaboratoryId,
} = require("./analysis.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/", auth, getAnalysisList);
router.get("/:id", auth, getAnalysisListByLaboratoryId);
router.post("/", auth, addAnalyisTest);
router.put("/", auth, updateAnalysisTest);
router.delete("/:id", auth, deleteAnalysis);

module.exports = router;
