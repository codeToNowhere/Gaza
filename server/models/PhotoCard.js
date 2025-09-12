//PhotoCard.js

const mongoose = require("mongoose");

const photoCardSchema = new mongoose.Schema(
  {
    image: { type: String, required: false, default: "" },
    name: { type: String, required: true, trim: true },
    age: { type: Number },
    condition: {
      type: String,
      enum: ["detained", "deceased", "missing", null],
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
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PhotoCard",
      default: null,
    },
  },
  { timestamps: true }
);

photoCardSchema.query.withCreatorDetails = function () {
  return this.populate("createdBy", "username email isBlocked");
};

photoCardSchema.pre("save", function (next) {
  next();
});

module.exports = mongoose.model("PhotoCard", photoCardSchema);
