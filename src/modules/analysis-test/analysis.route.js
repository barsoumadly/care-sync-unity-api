const { Router } = require("express");
const {
  getAnalysisList,
  addAnalyisTest,
  updateAnalysisTest,
  deleteAnalysis,
} = require("./analysis.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/", auth, getAnalysisList);
router.post("/", auth, addAnalyisTest);
router.put("/", auth, updateAnalysisTest);
router.delete("/:id", auth, deleteAnalysis);

module.exports = router;
