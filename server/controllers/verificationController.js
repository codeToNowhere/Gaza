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

  const provisionalPhotocard = new PhotoCard({
    // Info remaining constant
    image: originalPhotocard.image,
    createdBy: originalPhotocard.createdBy,

    // Provisional update
    name: name,
    age: age || null,
    months: months || null,
    condition: condition || null,
    biography: biography || "",
    isUnidentified: false,

    // Mark as provisional
    isProvisional: true,
    provisionalOf: originalPhotocard._id,
    status: "provisional",
    verificationStatus: "verification_pending",
  });

  await provisionalPhotocard.save();

  const verification = new Verification({
    originalPhotocard: photocardId,
    provisionalPhotocard: provisionalPhotocard._id,
    submittedBy: req.user._id,
    status: "pending",
    type: "identification",
  });

  await verification.save();

  originalPhotocard.verificationStatus = "verification_pending";
  await originalPhotocard.save();

  sendJsonResponse(res, 201, "Identification submitted for review.", {
    verification: {
      id: verification._id,
      status: verification.status,
      provisionalPhotocardId: provisionalPhotocard._id,
    },
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

  const verification = await Verification.findById(verificationId)
    .populate("originalPhotocard")
    .populate("provisionalPhotocard");

  validateVerification(verification);

  const originalNumber = verification.originalPhotocard.photocardNumber;
  const identifiedNumber = originalNumber
    ? `${originalNumber.toString().padStart(3, "0")}ID`
    : null;

  const deletedNumber = originalNumber
    ? `DELETED_${originalNumber}_${Date.now()}`
    : `DELETED_${Date.now()}`;

  await PhotoCard.findByIdAndUpdate(verification.originalPhotocard._id, {
    photocardNumber: deletedNumber,
  });

  const approvedPhotocard = await PhotoCard.findByIdAndUpdate(
    verification.provisionalPhotocard._id,
    {
      isProvisional: false,
      provisionalOf: null,
      photocardNumber: originalNumber,
      verificationStatus: "verified",
      status: "active",
    },
    { new: true }
  );

  // Soft delete provisional photocard
  await PhotoCard.findByIdAndUpdate(verification.originalPhotocard._id, {
    photocardNumber: identifiedNumber,
    isDeleted: true,
    status: "deleted",
    deletedAt: new Date(),
    deleteReason: "replaced_by_identification",
    replacedBy: approvedPhotocard._id,
  });

  await updateVerificationRecord(verification, "approved", req.user, null);

  sendJsonResponse(res, 200, "Identification approved successfully.", {
    approvedPhotocard: {
      id: approvedPhotocard._id,
      name: approvedPhotocard.name,
      photocardNumber: approvedPhotocard.photocardNumber,
    },
    originalPhotocard: {
      id: verification.originalPhotocard._id,
      photocardNumber: identifiedNumber,
    },
  });
});

const rejectVerification = catchAsync(async (req, res, next) => {
  const { verificationId } = req.params;
  const { comments } = req.body;

  const verification = await Verification.findById(verificationId).populate(
    "provisionalPhotocard"
  );

  validateVerification(verification);

  // Soft delete provisional
  await PhotoCard.findByIdAndUpdate(verification.provisionalPhotocard._id, {
    isDeleted: true,
    status: "deleted",
    deletedAt: new Date(),
    deleteReason: "rejected_identification",
    rejectionComments: comments || "",
  });

  // Restore original photocard
  await PhotoCard.findByIdAndUpdate(verification.originalPhotocard._id, {
    verificationStatus: "unverified",
    status: "active",
    isDeleted: false,
  });

  // Update verification record
  await updateVerificationRecord(
    verification,
    "rejected",
    req.user,
    comments || ""
  );

  sendJsonResponse(res, 200, "Identification rejected.", {
    rejectionComments: comments,
  });
});

const getVerificationById = catchAsync(async (req, res, next) => {
  const { verificationId } = req.params;

  const verification = await Verification.findById(verificationId)
    .populate("originalPhotocard")
    .populate("provisionalPhotocard")
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
