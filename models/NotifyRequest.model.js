// models/NotifyRequest.model.ts
import mongoose from "mongoose";

const NotifyRequestSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    contactDetails: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Notified"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const NotifyRequestModel =
  mongoose.models.NotifyRequest ||
  mongoose.model("NotifyRequest", NotifyRequestSchema);

export default NotifyRequestModel;