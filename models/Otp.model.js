import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema(
  {
    // Email aur mobile dono field daal diye aur required hata diya, 
    // taaki jo available ho wo save ho jaye.
    email: { type: String, lowercase: true, trim: true, default: null },
    mobile: { type: String, trim: true, default: null },
    otp: { type: String, required: true },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes expiry
    },
  },
  { timestamps: true }
);

// Search aur auto-delete ke liye indexes
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
OtpSchema.index({ email: 1, mobile: 1, otp: 1, expiresAt: -1 });

const OtpModel = mongoose.models.Otp || mongoose.model("Otp", OtpSchema, "otps");

export default OtpModel;