import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: "" },
  isApproved: { type: Boolean, default: false },
}, { timestamps: true });

const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema, "reviews");
export default ReviewModel;
