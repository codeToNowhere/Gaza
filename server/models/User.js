//User.js

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 30,
      trim: true,
    },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    flaggedCount: { type: Number, default: 0 },
    flaggedReason: { type: String, trim: true, default: null },
    lastFlaggedAt: { type: Date, default: null },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
