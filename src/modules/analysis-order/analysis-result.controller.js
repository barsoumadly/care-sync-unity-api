const AnalysisOrder = require("../../models/AnalysisOrder");
const Patient = require("../../models/Patient");
const Laboratory = require("../../models/Laboratory");
const AsyncHandler = require("../../utils/AsyncHandler");
const User = require("../../models/User");

const addAnalysisOrder = AsyncHandler(async (req, res) => {
  const laboratoryId = req.user._id;
  const { userId, results } = req.body.data;

  const [user] = await Patient.find({ publicId: userId });
  const userProfile = await User.findById(user.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const [laboratory] = await Laboratory.find({ userId: laboratoryId });
  if (!laboratory) {
    return res.status(404).json({ message: "Laboratory not found" });
  }

  const analysisOrder = new AnalysisOrder({
    laboratoryId,
    userId: user.userId,
    userPhoneNumber: user.phone,
    laboratoryName: laboratory.name,
    userName: userProfile.name,
    results,
  });

  await analysisOrder.save();

  res.status(201).json(analysisOrder);
});

const getAnalysisOrdersByUserId = AsyncHandler(async (req, res) => {
  const userId = req.user._id;

  const analysisOrders = await AnalysisOrder.find({ userId });

  res.status(200).json(analysisOrders);
});

const getAnalysisOrderById = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  const analysisOrder = await AnalysisOrder.findById(id);

  if (!analysisOrder) {
    return res.status(404).json({ message: "Analysis order not found" });
  }

  res.status(200).json(analysisOrder);
});

const getAnalysisOrdersByLaboratoryId = AsyncHandler(async (req, res) => {
  const laboratoryId = req.user._id;

  const analysisOrders = await AnalysisOrder.find({
    laboratoryId: laboratoryId,
  });

  res.status(200).json(analysisOrders);
});

const editAnalysisOrderStatus = AsyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, results } = req.body;

  const analysisOrder = await AnalysisOrder.findByIdAndUpdate(
    id,
    { status, results, updatedAt: Date.now() },
    { new: true }
  );

  if (!analysisOrder) {
    return res.status(404).json({ message: "Analysis order not found" });
  }

  res.status(200).json(analysisOrder);
});

module.exports = {
  addAnalysisOrder,
  getAnalysisOrdersByUserId,
  getAnalysisOrderById,
  getAnalysisOrdersByLaboratoryId,
  editAnalysisOrderStatus,
};
