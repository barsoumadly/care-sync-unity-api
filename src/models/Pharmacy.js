const mongoose = require("mongoose");

const pharmacySchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
    },
    slug: {
      type: String,
    },
    phone: {
      type: String,
    },
    foundedYear: {
      type: Number,
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
    rating: {
      type: Number,
      default: 3,
    },
  },
  {
    timestamps: true,
  }
);

// Function to check if profile is complete
const checkProfileComplete = function (pharmacy) {
  const hasName = !!pharmacy.name;
  const hasPhone = !!pharmacy.phone;
  const hasAddress = !!(
    pharmacy.address &&
    pharmacy.address.city &&
    pharmacy.address.area &&
    pharmacy.address.address
  );

  return hasName && hasPhone && hasAddress;
};

// Pre-save hook
pharmacySchema.pre("save", async function (next) {
  const isComplete = checkProfileComplete(this);
  // Update the associated user's profileCompleted field
  await mongoose.model("User").findByIdAndUpdate(this.userId, {
    profileCompleted: isComplete,
  });
  next();
});

// Pre-update hook
pharmacySchema.pre(["updateOne", "findOneAndUpdate"], async function (next) {
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

const Pharmacy = mongoose.model("Pharmacy", pharmacySchema);
module.exports = Pharmacy;
