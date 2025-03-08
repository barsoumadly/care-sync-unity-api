const mongoose = require("mongoose");
const doctorSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    clinicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Clinic",
      required: true,
      index: true,
    },
    phone: {
      type: String,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    specialization: {
      type: String,
      required: true,
      index: true,
    },
    biography: {
      type: String,
    },
    education: {
      name: {
        type: String,
      },
      details: {
        type: String,
      },
    },
    experience: {
      type: Number,
    },
    certification: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Function to check if profile is complete
const checkProfileComplete = function (doctor) {
  const hasPhone = !!doctor.phone;
  const hasAge = !!doctor.age;
  const hasGender = !!doctor.gender;
  const hasSpecialization = !!doctor.specialization;
  const hasBiography = !!doctor.biography;
  const hasEducation = !!(
    doctor.education &&
    doctor.education.name &&
    doctor.education.details
  );
  const hasExperience = !!doctor.experience;
  const hasCertification = !!doctor.certification;

  return (
    hasPhone &&
    hasAge &&
    hasGender &&
    hasSpecialization &&
    hasBiography &&
    hasEducation &&
    hasExperience &&
    hasCertification
  );
};

// Pre-save hook
doctorSchema.pre("save", async function (next) {
  const isComplete = checkProfileComplete(this);
  // Update the associated user's profileCompleted field
  await mongoose.model("User").findByIdAndUpdate(this.userId, {
    profileCompleted: isComplete,
  });
  next();
});

// Pre-update hook
doctorSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
  const update = this.getUpdate();
  const options = this.getOptions();
  const isUpsert = options.upsert && options.context?.isUpsert;

  if (update) {
    try {
      let updatedDoc;
      const existingDoc = await this.model.findOne(this.getQuery());

      // Handle both update and upsert cases
      if (existingDoc) {
        // Regular update - merge existing doc with updates
        updatedDoc = {
          ...existingDoc.toObject(),
          ...update,
          ...update.$set
        };
      } else if (isUpsert) {
        // Upsert case - use the update data directly
        updatedDoc = {
          ...update,
          ...update.$set
        };
      }

      if (updatedDoc) {
        const isComplete = checkProfileComplete(updatedDoc);
        // Update the associated user's profileCompleted field
        const userId = existingDoc?.userId || update.userId;
        if (userId) {
          await mongoose.model("User").findByIdAndUpdate(userId, {
            profileCompleted: isComplete
          });
        }
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;
