const mongoose = require("mongoose");

const ReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportType: { type: String, enum: ["photocard", "user"], required: true },
    photocard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reasonType: {
      type: String,
      enum: ["duplicate", "inappropriate", "misleading", "other"],
      required: true,
    },
    reason: {
      type: String,
      required: function () {
        return this.reasonType !== "duplicate";
      },
      trim: true,
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Ensure only one of photocard or reportedUser is set
ReportSchema.pre("save", function (next) {
  if (this.reportType === "photocard" && !this.photocard) {
    return next(new Error("Photocard ID is required for photocard reports."));
  }
  if (this.reportType === "user" && !this.reportedUser) {
    return next(new Error("User ID is required for user reports."));
  }
  if (this.reportType === "photocard" && this.reportedUser) {
    this.reportedUser = undefined;
  }
  if (this.reportType === "user" && this.photocard) {
    this.photocard = undefined;
  }

  if (this.reasonType === "duplicate" && !this.reason) {
    this.reason = "User reported as duplicate";
  }

  next();
});

ReportSchema.query.withPopulatedFields = function () {
  return this.populate("reportedBy", "username email")
    .populate("photocard", "name image")
    .populate("reportedUser", "username email")
    .populate("duplicateOf", "name image");
};

module.exports = mongoose.model("Report", ReportSchema);
