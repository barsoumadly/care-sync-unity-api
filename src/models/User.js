const mongoose = require("mongoose");
const { roles } = require("../config/roles");
const passwordUtils = require("../utils/Password");
const ApiError = require("../utils/ApiError");
const { StatusCodes } = require("http-status-codes");
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: roles,
      default: "patient",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return await passwordUtils.comparePassword(password, user.password);
};

userSchema.methods.verifyEmail = async function (token) {
  const user = this;
  if (user.emailVerificationToken !== token) {
    throw new ApiError("invalid token", StatusCodes.BAD_REQUEST);
  }
  user.emailVerificationToken = undefined;
  user.isEmailVerified = true;
  await user.save();
  return true;
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await passwordUtils.hashPassword(user.password);
  }
  next();
});

/**
 * @typedef User
 */
const User = mongoose.model("User", userSchema);

module.exports = User;
