const mongoose = require("mongoose");

const analysisOrderSchema = new mongoose.Schema({
  laboratoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Laboratory",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userPhoneNumber: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  laboratoryName: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["processing", "completed", "cancelled"],
    default: "processing",
  },
  results: [
    {
      name: {
        type: String,
        required: true,
      },
      result: {
        type: String,
        default: "__ mg/dl",
      },
      normalResult: {
        type: String,
        default: "__ to __ mg/dl",
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const AnalysisOrder = mongoose.model("AnalysisOrder", analysisOrderSchema);

module.exports = AnalysisOrder;
