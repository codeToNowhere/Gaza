// verificationController.js
const mongoose = require("mongoose");
const PhotoCard = require("../models/PhotoCard");
const Verification = require("../models/Verification");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { sendJsonResponse } = require("../utils/responseHelpers");
const {
  validateVerification,
  updateVerificationRecord,
  createVerificationResponse,
} = require("../utils/verificationHelpers");

// --- USER ENDPOINTS ---
const submitIdentification = catchAsync(async (req, res, next) => {
  const { photocardId } = req.params;
  const { name, age, months, condition, biography } = req.body;

  if (!name) {
    return next(new AppError("Name is required for identification.", 400));
  }

  const originalPhotocard = await PhotoCard.findById(photocardId);
  if (!originalPhotocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  if (!originalPhotocard.isUnidentified) {
    return next(new AppError("Photocard is already identified.", 400));
  }

  const existingVerification = await Verification.findOne({
    originalPhotocard: photocardId,
    status: "pending",
  });

  if (existingVerification) {
    return next(
      new AppError("A verification is already pending for this photocard.", 409)
    );
  }

  const verification = new Verification({
    originalPhotocard: photocardId,
    proposedData: {
      name,
      age: age || null,
      months: months || null, // ← Added months back (was missing!)
      condition: condition || null,
      biography: biography || "",
      isUnidentified: false,
    },
    submittedBy: req.user._id,
    status: "pending",
  });

  await verification.save();

  originalPhotocard.verificationStatus = "verification_pending";
  await originalPhotocard.save();

  sendJsonResponse(res, 201, "Identification submitted for review.", {
    verification: { id: verification._id, status: verification.status },
  });
});

// --- ADMIN ENDPOINTS ---
const getPendingVerifications = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const verifications = await Verification.find({ status: "pending" })
    .populate("originalPhotocard", "name image condition createdBy")
    .populate("submittedBy", "username email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Verification.countDocuments({ status: "pending" });

  sendJsonResponse(res, 200, "Pending verifications fetched successfully.", {
    verifications,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

const approveVerification = catchAsync(async (req, res, next) => {
  const { verificationId } = req.params;
  const { comments } = req.body;

  const verification = await Verification.findById(verificationId).populate(
    "originalPhotocard"
  );

  validateVerification(verification);

  // Create new identified photocard
  const newPhotocard = new PhotoCard({
    ...verification.proposedData,
    image: verification.originalPhotocard.image,
    createdBy: verification.originalPhotocard.createdBy,
    identifiedVersion: verification.originalPhotocard._id,
  });

  await newPhotocard.save();

  // Update original photocard
  verification.originalPhotocard.identifiedVersion = newPhotocard._id;
  verification.originalPhotocard.verificationStatus = "verified";
  await verification.originalPhotocard.save();

  // Update verification record
  await updateVerificationRecord(verification, "approved", req.user, comments);

  sendJsonResponse(res, 200, "Verification approved successfully.", {
    newPhotocard: { id: newPhotocard._id, name: newPhotocard.name },
    originalPhotocard: { id: verification.originalPhotocard._id },
  });
});

const rejectVerification = catchAsync(async (req, res, next) => {
  const { verificationId } = req.params;
  const { comments } = req.body;

  const verification = await Verification.findById(verificationId).populate(
    "originalPhotocard"
  );

  validateVerification(verification);

  // Update original photocard
  verification.originalPhotocard.verificationStatus = "rejected";
  await verification.originalPhotocard.save();

  // Update verification record
  await updateVerificationRecord(verification, "rejected", req.user, comments);

  sendJsonResponse(
    res,
    200,
    "Verification rejected successfully.",
    createVerificationResponse(verification)
  );
});

const getVerificationById = catchAsync(async (req, res, next) => {
  const { verificationId } = req.params;

  const verification = await Verification.findById(verificationId)
    .populate("originalPhotocard")
    .populate("submittedBy", "username email")
    .populate("reviewedBy", "username email");

  if (!verification) {
    return next(new AppError("Verification not found.", 404));
  }

  sendJsonResponse(res, 200, "Verification fetched successfully.", {
    verification,
  });
});

module.exports = {
  submitIdentification,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getVerificationById,
};
