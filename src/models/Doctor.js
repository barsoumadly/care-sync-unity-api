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
      index: true,
    },
    phone: {
      type: String,
    },
    dateOfBirth: {
      type: Date,
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
    education: [
      {
        institution: {
          type: String,
        },
        degree: {
          type: String,
        },
        startingDate: {
          type: Date,
        },
        endingDate: {
          type: Date,
        },
        _id: false,
      },
    ],
    experience: [
      {
        hospital: {
          type: String,
        },
        position: {
          type: String,
        },
        startingDate: {
          type: Date,
        },
        endingDate: {
          type: Date,
        },
        _id: false,
      },
    ],
    certification: [
      {
        name: {
          type: String,
        },
        description: {
          type: String,
        },
        _id: false,
      },
    ],
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
  const hasEducation = !!(doctor.education && doctor.education.length > 0);
  const hasExperience = !!(
    doctor.experience &&
    (Array.isArray(doctor.experience)
      ? doctor.experience.length > 0
      : doctor.experience > 0)
  );
  const hasCertification = !!(
    doctor.certification && doctor.certification.length > 0
  );

  return (
    hasPhone &&
    hasAge &&
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

const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;
