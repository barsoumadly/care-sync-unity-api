const mongoose = require("mongoose");
const slugify = require("slugify");

// Function to check if profile is complete
const checkProfileComplete = function (clinic) {
  const hasName = !!clinic.name;
  const hasPhone = !!clinic.phone;
  const hasAddress = !!(
    clinic.address &&
    clinic.address.street &&
    clinic.address.city
  );

  return hasName && hasPhone && hasAddress;
};

const clinicSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    slug: {
      type: String,
    },
    photos: [
      {
        url: String,
        public_id: String,
      },
    ],
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
        index: true,
      },
      state: {
        type: String,
      },
    },
    foundedYear: {
      type: String,
    },
    biography: {
      type: String,
    },
    phone: {
      type: String,
      required: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      default: 3,
    },
    doctors: [
      {
        id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Doctor",
        },
        schedule: [
          {
            day: {
              type: String,
              enum: [
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
              ],
              required: true,
            },
            startTime: {
              type: String,
              required: true,
            },
            endTime: {
              type: String,
              required: true,
            },
          },
        ],
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

// Pre-save hook
clinicSchema.pre("save", async function (next) {
  this.slug = slugify(`${this.name} hospital`, { lower: true });
  const isComplete = checkProfileComplete(this);
  // Update the associated user's profileCompleted field
  await mongoose.model("User").findByIdAndUpdate(this.adminId, {
    profileCompleted: isComplete,
  });
  next();
});

// Pre-update hook
clinicSchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
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
        await mongoose.model("User").findByIdAndUpdate(doc.adminId, {
          profileCompleted: isComplete,
        });
      }
      // For new documents created by upsert
      else if (options.upsert) {
        const newDoc = {
          ...this.getQuery(),
          ...update,
          ...update.$set,
        };
        const isComplete = checkProfileComplete(newDoc);
        // Get adminId from the query since it's a new document
        const adminId = this.getQuery().adminId;
        if (adminId) {
          await mongoose.model("User").findByIdAndUpdate(adminId, {
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

const Clinic = mongoose.model("Clinic", clinicSchema);
module.exports = Clinic;
