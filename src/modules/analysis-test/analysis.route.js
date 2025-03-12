const { Router } = require("express");
const {
  getAnalysisList,
  addAnalyisTest,
  updateAnalysisTest,
} = require("./analysis.controller");
const auth = require("../../middlewares/auth");

const router = Router();

router.get("/", auth, getAnalysisList);
router.post("/", auth, addAnalyisTest);
router.put("/", auth, updateAnalysisTest);

module.exports = router;
