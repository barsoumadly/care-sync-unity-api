const AnalysisTest = require("../../models/AnalysisTest");
const AsyncHandler = require("../../utils/AsyncHandler");
const User = require("../../models/User");

const getAnalysisList = AsyncHandler(async (req, res) => {
  const laboratoryId = req.user._id;

  const laboratory = await User.findById(laboratoryId);
  if (!laboratory) {
    return res.status(404).json({ message: "Laboratory not found" });
  }

  const analysisList = await AnalysisTest.findOne({
    laboratoryId: laboratoryId,
  });

  if (!analysisList) {
    return res
      .status(404)
      .json({ message: "Analysis not found for this laboratory" });
  }

  res.status(200).json(analysisList);
});

const getAnalysisListByLaboratoryId = AsyncHandler(async (req, res) => {
  const { id: laboratoryId } = req.params;

  const laboratory = await User.findById(laboratoryId);
  if (!laboratory) {
    return res.status(404).json({ message: "Laboratory not found" });
  }

  const analysisList = await AnalysisTest.findOne({
    laboratoryId: laboratoryId,
  });

  if (!analysisList) {
    return res
      .status(404)
      .json({ message: "Analysis not found for this laboratory" });
  }

  res.status(200).json(analysisList);
});

const addAnalyisTest = AsyncHandler(async (req, res) => {
  const laboratoryId = req.user._id;
  const analysisList = req.body;
  const laboratory = await User.findById(laboratoryId);

  if (!laboratory) {
    return res.status(404).json({ message: "Laboratory not found" });
  }

  if (!Array.isArray(analysisList) || analysisList.length === 0) {
    return res.status(400).json({ message: "Analysis array is required" });
  }

  for (const analysis of analysisList) {
    if (!analysis.name || !analysis.price || !analysis.details) {
      return res.status(400).json({ message: "Invalid analysis data" });
    }
  }

  let analysisDocument = await AnalysisTest.findOne({
    laboratoryId: laboratoryId,
  });
  if (!analysisDocument) {
    analysisDocument = new AnalysisTest({
      laboratoryId: laboratoryId,
      analysis: [],
    });
  }

  analysisDocument.analysisTests.push(...analysisList);

  await analysisDocument.save();

  res.status(201).json({
    message: "analysis added successfully",
    data: analysisDocument,
  });
});

const updateAnalysisTest = AsyncHandler(async (req, res) => {
  const laboratoryId = req.user._id;
  const { analysisId, analysisData } = req.body;

  const analysisDocument = await AnalysisTest.findOne({
    laboratoryId: laboratoryId,
  });

  if (!analysisDocument) {
    return res
      .status(404)
      .json({ message: "Analysis not found for this laboratory" });
  }

  const analysis = analysisDocument.analysisTests.find(
    (analysis) => analysis.id === analysisId
  );

  if (!analysis) {
    return res.status(404).json({ message: "Analysis not found" });
  }

  analysis.name = analysisData.name;
  analysis.details = analysisData.details;
  analysis.price = analysisData.price;

  await analysisDocument.save();

  res.status(200).json({
    message: "Analysis details updated successfully",
    data: analysisDocument,
  });
});

const deleteAnalysis = AsyncHandler(async (req, res) => {
  const laboratoryId = req.user._id;
  const { id: analysisId } = req.params;

  const analysisDocument = await AnalysisTest.findOne({ laboratoryId });

  if (!analysisDocument) {
    return res
      .status(404)
      .json({ message: "Analysis not found for this laboratory" });
  }

  const analysisIndex = analysisDocument.analysisTests.findIndex(
    (analysis) => analysis.id === analysisId
  );

  if (analysisIndex === -1) {
    return res.status(404).json({ message: "Analysis not found" });
  }

  analysisDocument.analysisTests.splice(analysisIndex, 1);

  await analysisDocument.save();

  res
    .status(200)
    .json({ message: "Analysis deleted successfully", data: analysisDocument });
});

module.exports = {
  getAnalysisList,
  addAnalyisTest,
  updateAnalysisTest,
  deleteAnalysis,
  getAnalysisListByLaboratoryId,
};
