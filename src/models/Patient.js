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
      type: Date,
      required: true,
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
const checkProfileComplete = function(patient) {
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
patientSchema.pre('save', async function(next) {
  const isComplete = checkProfileComplete(this);
  // Update the associated user's profileCompleted field
  await mongoose.model('User').findByIdAndUpdate(this.userId, {
    profileCompleted: isComplete
  });
  next();
});

// Pre-update hook
patientSchema.pre(['updateOne', 'findOneAndUpdate'], async function(next) {
  const update = this.getUpdate();
  if (update) {
    try {
      const doc = await this.model.findOne(this.getQuery());
      if (doc) {
        const updatedDoc = {
          ...doc.toObject(),
          ...update,
          ...update.$set // Include $set updates if any
        };
        const isComplete = checkProfileComplete(updatedDoc);
        // Update the associated user's profileCompleted field
        await mongoose.model('User').findByIdAndUpdate(doc.userId, {
          profileCompleted: isComplete
        });
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Patient = mongoose.model("Patient", patientSchema);
module.exports = Patient;
