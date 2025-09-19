// verificationHelpers.js
const AppError = require("./AppError");

// Common validation logic
const validateVerification = (verification) => {
  if (!verification) {
    throw new AppError("Verification not found.", 404);
  }

  if (verification.status !== "pending") {
    throw new AppError("Verification has already been processed.", 400);
  }

  return verification;
};

// Common update logic for verification records
const updateVerificationRecord = (
  verification,
  status,
  user,
  comments = ""
) => {
  verification.status = status;
  verification.reviewedBy = user._id;
  verification.reviewedAt = new Date();
  verification.reviewComments = comments;
  return verification.save();
};

// Common response format
const createVerificationResponse = (verification, additionalData = {}) => {
  return {
    verification: {
      id: verification._id,
      status: verification.status,
      ...additionalData,
    },
  };
};

module.exports = {
  validateVerification,
  updateVerificationRecord,
  createVerificationResponse,
};
