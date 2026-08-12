import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: String,
    otp: String,
    otpExpiry: Date,
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/** @type {import("mongoose").Model<any>} */
const UserModel = mongoose.models.User ||
  mongoose.model("User", UserSchema);

export default UserModel;