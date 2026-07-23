import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ["percent", "flat"], default: "percent" },
  value: { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 0 },
  maxUses: { type: Number, default: null },
  usedCount: { type: Number, default: 0 },
  expiresAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const CouponModel = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema, "coupons");
export default CouponModel;
