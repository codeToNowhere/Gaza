// models/Verification.js
const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    originalPhotocard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      required: true,
    },
    provisionalPhotocard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      required: true,
    },
    originalPhotocardNumber: { type: Number },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: { type: Date },
    reviewComments: { type: String, trim: true },
    type: {
      type: String,
      enum: ["identification", "correction", "other"],
      default: "identification",
    },
  },
  { timestamps: true }
);

// Add index for faster queries
verificationSchema.index({ originalPhotocard: 1, status: 1 });
verificationSchema.index({ provisionalPhotocard: 1 });
verificationSchema.index({ submittedBy: 1 });
verificationSchema.index({ status: 1 });
verificationSchema.index({ type: 1 });

module.exports = mongoose.model("Verification", verificationSchema);
