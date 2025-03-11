const mongoose = require("mongoose");

const medicineSchema = mongoose.Schema(
  {
    pharmacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      unique: true,
      index: true,
    },
    medicines: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        expirationDate: {
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

const Medicine = mongoose.model("Medicine", medicineSchema);

module.exports = Medicine;
