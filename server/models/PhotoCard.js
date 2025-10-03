//PhotoCard.js

const mongoose = require("mongoose");

const photoCardSchema = new mongoose.Schema(
  {
    image: { type: String, required: false, default: "" },
    name: { type: String, required: true, trim: true },
    isUnidentified: { type: Boolean, default: false },
    age: { type: Number },
    months: { type: Number },
    condition: {
      type: String,
      enum: ["injured", "deceased", "missing", null],
      default: null,
    },
    biography: { type: String, trim: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    blocked: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    isConfirmedDuplicate: { type: Boolean, default: false },
    isSuspectedDuplicate: { type: Boolean, default: false },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
    identifiedVersion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
    originalPhotocard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "verification_pending", "verified", "rejected"],
      default: "unverified",
    },
    photocardNumber: {
      type: mongoose.Schema.Types.Mixed,
      unique: true,
      sparse: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deleteReason: { type: String, default: null },
    replacedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
    isProvisional: { type: Boolean, default: false },
    provisionalOf: { type: mongoose.Schema.Types.ObjectId, ref: "PhotoCard" },
  },
  { timestamps: true }
);

photoCardSchema.pre("save", function (next) {
  if (this.age >= 3 && this.months) {
    this.months = undefined;
  }
  next();
});

photoCardSchema.query.withCreatorDetails = function () {
  return this.populate("createdBy", "username email isBlocked");
};

module.exports = mongoose.model("PhotoCard", photoCardSchema);
