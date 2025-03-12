const mongoose = require("mongoose");

const analysisTestSchema = mongoose.Schema(
  {
    laboratoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Laboratory",
      required: true,
      unique: true,
      index: true,
    },
    analysisTests: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
        },
        details: {
          type: String,
          required: true,
        },
      },
    ],
  },

  {
    timestamps: true,
  }
);

const AnalysisTest = mongoose.model("AnalysisTest", analysisTestSchema);

module.exports = AnalysisTest;
