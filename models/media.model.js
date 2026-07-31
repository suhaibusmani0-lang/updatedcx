import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    assetId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    path: {
      type: String,
      required: true,
      trim: true,
    },

    thumbnailUrl: {
      type: String,
      required: true,
      trim: true,
    },

    alt: {
      type: String,
      trim: true,
      default: "",
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Media ||
  mongoose.model("Media", MediaSchema);