// models/Verification.js
const mongoose = require("mongoose");

const verificationSchema = new mongoose.Schema(
  {
    originalPhotocard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      required: true,
    },
    proposedData: {
      name: { type: String, required: true, trim: true },
      age: { type: Number },
      months: { type: Number },
      condition: {
        type: String,
        enum: ["detained", "deceased", "missing", null],
        default: null,
      },
      biography: { type: String, trim: true },
      isUnidentified: { type: Boolean, default: false },
    },
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
  },
  { timestamps: true }
);

// Add index for faster queries
verificationSchema.index({ originalPhotocard: 1, status: 1 });
verificationSchema.index({ submittedBy: 1 });
verificationSchema.index({ status: 1 });

module.exports = mongoose.model("Verification", verificationSchema);
