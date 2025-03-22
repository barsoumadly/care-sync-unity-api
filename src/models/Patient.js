const mongoose = require("mongoose");

const patientSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dateOfBirth: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    phone: {
      type: String,
    },
    address: {
      city: {
        type: String,
      },
      area: {
        type: String,
      },
      address: {
        type: String,
      },
    },
    bloodType: {
      type: String,
    },
    temperature: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    height: {
      type: Number,
    },
    heartRate: {
      type: Number,
    },
    bloodSugar: {
      type: Number,
    },
    bloodPressure: {
      type: Number,
    },
    medicalHistory: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Function to check if profile is complete
const checkProfileComplete = function (patient) {
  const hasPhone = !!patient.phone;
  const hasGender = !!patient.gender;
  const hasAddress = !!(
    patient.address &&
    patient.address.city &&
    patient.address.area &&
    patient.address.address
  );

  return hasPhone && hasGender && hasAddress;
};

// Pre-save hook
patientSchema.pre("save", async function (next) {
  const isComplete = checkProfileComplete(this);
  // Update the associated user's profileCompleted field
  await mongoose.model("User").findByIdAndUpdate(this.userId, {
    profileCompleted: isComplete,
  });
  next();
});

// Pre-update hook
patientSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
  const update = this.getUpdate();
  const options = this.getOptions();

  if (update) {
    try {
      // For existing documents
      const doc = await this.model.findOne(this.getQuery());
      if (doc) {
        const updatedDoc = {
          ...doc.toObject(),
          ...update,
          ...update.$set,
        };
        const isComplete = checkProfileComplete(updatedDoc);
        await mongoose.model("User").findByIdAndUpdate(doc.userId, {
          profileCompleted: isComplete,
        });
      }
      // For new documents created by upsert
      else if (options.upsert) {
        const newDoc = {
          ...this.getQuery(), // Contains the userId
          ...update,
          ...update.$set,
        };
        const isComplete = checkProfileComplete(newDoc);
        // Get userId from the query since it's a new document
        const userId = this.getQuery().userId;
        if (userId) {
          await mongoose.model("User").findByIdAndUpdate(userId, {
            profileCompleted: isComplete,
          });
        }
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
