// photocardController.js

const mongoose = require("mongoose");
const PhotoCard = require("../models/PhotoCard");
const Report = require("../models/Report");
const Sequence = require("../models/Sequence");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
  isRealImage,
  deleteImageFile,
  handleImageUpload,
} = require("../utils/imageHelpers");
const {
  preparePhotocardData,
  duplicatePhotocardsQuery,
  buildPhotocardQuery,
} = require("../utils/photocardHelpers");
const { resolvePendingReports } = require("../utils/reportHelpers");
const { sendJsonResponse } = require("../utils/responseHelpers");
const fs = require("fs");

// --- PUBLIC ACTIONS ---
const getAllPhotocards = catchAsync(async (req, res, next) => {
  const { excludeUnidentified, page = 1, limit = 100 } = req.query;

  let query = { blocked: false, isDeleted: false, isProvisional: false };

  if (excludeUnidentified === "true") {
    query.isUnidentified = false;
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [photocards, totalCount] = await Promise.all([
    PhotoCard.find(query)
      .withCreatorDetails()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    PhotoCard.countDocuments(query),
  ]);

  let injuredCount = 0;
  let missingCount = 0;
  let deceasedCount = 0;
  let totalVisibleCount = 0;

  photocards.forEach((photocard) => {
    if (photocard.blocked || photocard.isConfirmedDuplicate) {
      return;
    }

    const condition = photocard.condition;

    if (condition === "missing") {
      missingCount++;
    } else if (condition === "deceased") {
      deceasedCount++;
    } else if (condition === "injured") {
      injuredCount++;
    }
    totalVisibleCount++;
  });

  //Pagination
  const totalPages = Math.ceil(totalCount / limitNum);
  const hasNextPage = pageNum < totalPages;
  const hasPrevPage = pageNum > 1;

  sendJsonResponse(res, 200, "Photocards fetched successfully.", {
    photocards,
    counts: {
      missing: missingCount,
      deceased: deceasedCount,
      injured: injuredCount,
      total: totalVisibleCount,
    },
    pagination: {
      currentPage: pageNum,
      totalPages,
      totalCount,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? pageNum + 1 : null,
      prevPage: hasPrevPage ? pageNum - 1 : null,
      limitNum,
    },
  });
});

const getPhotocard = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  let photocard;
  let query = {
    ...buildPhotocardQuery(id),
    isProvisional: false,
    isDeleted: false,
    blocked: false,
  };

  photocard = await PhotoCard.findOne(query).withCreatorDetails();

  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  sendJsonResponse(res, 200, "Photocard fetched successfully.", { photocard });
});

const searchPhotocards = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query) {
    return next(new AppError("Search query is required.", 400));
  }

  let searchCriteria = {
    ...buildPhotocardQuery(query),
    isDeleted: false,
    blocked: false,
    isProvisional: false,
  };

  const photocards = await PhotoCard.find(searchCriteria)
    .sort({ createdAt: -1 })
    .limit(100);

  sendJsonResponse(res, 200, "Search results fetched successfully.", {
    photocards,
  });
});

const checkExistingPhotocards = catchAsync(async (req, res, next) => {
  const { name, age, months } = req.query;

  if (!name) {
    return next(new AppError("A name is required for this check.", 400));
  }

  const query = duplicatePhotocardsQuery(name, age, months);

  const existingPhotocards = await PhotoCard.find(query).select(
    "_id name age months image biography"
  );

  sendJsonResponse(res, 200, "Existing photocards checked successfully.", {
    existingPhotocards,
  });
});

const getPotentialDuplicates = catchAsync(async (req, res, next) => {
  const { name, age, months, currentPhotocardId } = req.query;

  if (!name) {
    return next(
      new AppError("A name is required for this duplicate check.", 400)
    );
  }

  let query = duplicatePhotocardsQuery(name, age, months);

  query.blocked = false;

  // Exclude current photocard being reported as a duplicate
  if (
    currentPhotocardId &&
    mongoose.Types.ObjectId.isValid(currentPhotocardId)
  ) {
    query._id = { $ne: currentPhotocardId };
  }

  const photocards = await PhotoCard.find(query)
    .select("_id name age months image biography")
    .sort({ createdAt: -1 });

  sendJsonResponse(res, 200, "Potential duplicates fetched successfully.", {
    photocards,
  });
});

// --- AUTHENTICATED ACTIONS ---
// photocardController.js

const createPhotocard = catchAsync(async (req, res, next) => {
  // 1. Get and increment the atomic counter immediately
  const sequence = await Sequence.findByIdAndUpdate(
    "photocardCounter",
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  const requiredFields = ["name"];
  const missingFields = requiredFields.filter((field) => !req.body[field]);

  if (missingFields.length > 0) {
    if (req.file) {
      deleteImageFile(req.file.filename);
    }
    return next(
      new AppError("Missing required fields.", 400, { missing: missingFields })
    );
  }

  // 2. Prepare the photocard data
  const photocardData = preparePhotocardData(req, req.body, req.file);
  photocardData.photocardNumber = sequence.value;
  photocardData.createdBy = req.user._id;

  if (!sequence || typeof sequence.value !== "number") {
    return next(new AppError("Failed to generate photocard number.", 500));
  }

  if (req.body.isUnidentified === "true") {
    photocardData.isUnidentified = true;
    photocardData.verificationStatus = "unverified";
  } else {
    photocardData.isUnidentified = false;
    photocardData.verificationStatus = "verified";
  }

  // 3. Handle image processing and attach to photocardData
  if (req.file) {
    try {
      photocardData.image = await handleImageUpload(req.file);
    } catch (err) {
      return next(new AppError("Failed to process image.", 500, err));
    }
  }

  // 4. Validate duplicate ID and clean up image if invalid
  if (
    photocardData.isConfirmedDuplicate &&
    !mongoose.Types.ObjectId.isValid(photocardData.duplicateOf)
  ) {
    if (photocardData.image) {
      deleteImageFile(photocardData.image);
    }
    return next(
      new AppError("Invalid original photocard ID provided for duplicate.", 400)
    );
  }

  // 5. Create the photocard in a single step
  const newPhotocard = await PhotoCard.create(photocardData);

  sendJsonResponse(res, 201, "Photocard created successfully.", {
    photocard: {
      id: newPhotocard._id,
      image: newPhotocard.image ? "✓" : "✗",
      name: newPhotocard.name,
      photocardNumber: newPhotocard.photocardNumber,
    },
  });
});

const getUserPhotocards = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const userPhotocards = await PhotoCard.find({ createdBy: userId })
    .withCreatorDetails()
    .sort({ createdAt: -1 });

  sendJsonResponse(res, 200, "User photocards fetched successfully.", {
    photocards: userPhotocards,
  });
});

const updatePhotocard = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const photocardId = req.params.id;

  const photocard = await PhotoCard.findById(photocardId);
  if (!photocard) {
    if (req.file) {
      deleteImageFile(req.file.filename);
    }
    return next(new AppError("Photocard not found.", 404));
  }

  if (photocard.createdBy.toString() !== userId.toString()) {
    if (req.file) {
      deleteImageFile(req.file.filename);
    }
    return next(new AppError("Not authorized to update this photocard.", 403));
  }

  const updates = preparePhotocardData(req, req.body, req.file);

  if (req.file) {
    try {
      //Delete old image first, if it's a real image
      if (isRealImage(photocard.image)) {
        await deleteImageFile(photocard.image);
      }
      // Handle new upload
      updates.image = await handleImageUpload(req.file);
    } catch (err) {
      return next(new AppError("Failed to process image.", 500, err));
    }
  } else if (req.body.image === "") {
    if (isRealImage(photocard.image)) {
      await deleteImageFile(photocard.image);
    }
    updates.image = "";
  }

  const updatedPhotocard = await PhotoCard.findByIdAndUpdate(
    photocardId,
    { $set: updates },
    { new: true, runValidators: true }
  );

  sendJsonResponse(res, 200, "Photocard updated successfully.", {
    photocard: updatedPhotocard,
  });
});

const softDeletePhotocard = catchAsync(async (req, res, next) => {
  const { id: photocardId } = req.params;
  const userId = req.user._id;

  const photocard = await PhotoCard.findById(photocardId);

  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  const isOwner = photocard.createdBy.toString() === userId.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return next(new AppError("Not authorized to delete this photocard.", 403));
  }

  photocard.isDeleted = true;
  photocard.deletedAt = new Date();
  await photocard.save();

  // Delete the image from your storage
  if (isRealImage(photocard.image)) {
    deleteImageFile(photocard.image);
  }

  if (isAdmin) {
    await resolvePendingReports(
      photocardId,
      userId,
      "Admin deleted photocard."
    );
  }

  const message = isAdmin
    ? "Photocard marked as deleted by admin and reports resolved."
    : "Photocard marked as deleted successfully.";

  sendJsonResponse(res, 200, message);
});

// --- ADMIN ACTIONS ---

// --- Query Functions ---

const getPhotocardCounts = catchAsync(async (req, res) => {
  const [
    flaggedCount,
    blockedCount,
    deletedCount,
    duplicateCount,
    unidentifiedCount,
    totalCount,
  ] = await Promise.all([
    PhotoCard.countDocuments({ flagged: true, blocked: false }),
    PhotoCard.countDocuments({ blocked: true }),
    PhotoCard.countDocuments({ isDeleted: true }),
    PhotoCard.countDocuments({ isConfirmedDuplicate: true }),
    PhotoCard.countDocuments({ isUnidentified: true }),
    PhotoCard.countDocuments({}),
  ]);

  sendJsonResponse(res, 200, "Photocard counts fetched successfully.", {
    counts: {
      flagged: flaggedCount,
      blocked: blockedCount,
      deleted: deletedCount,
      duplicates: duplicateCount,
      unidentified: unidentifiedCount,
      total: totalCount,
    },
  });
});

const getPhotocardsByStatus = catchAsync(async (req, res) => {
  const { status } = req.query;
  let query = {};

  if (status === "flagged") {
    query = { flagged: true, blocked: false };
  } else if (status === "blocked") {
    query = { blocked: true };
  } else if (status === "both") {
    query = { $or: [{ flagged: true }, { blocked: true }] };
  } else {
    return sendJsonResponse(
      res,
      200,
      `No photocards found for status: ${status}.`,
      { photocards: [] }
    );
  }

  const photocards = await PhotoCard.find(query)
    .withCreatorDetails()
    .sort({ createdAt: -1 });

  sendJsonResponse(res, 200, `Photocards fetched successfully.`, {
    photocards,
  });
});

const getPhotocardAdmin = catchAsync(async (req, res, next) => {
  const photocard = await PhotoCard.findById(
    req.params.id
  ).withCreatorDetails();

  if (!photocard) {
    return next(new AppError("Photocard not found", 404));
  }

  // Admin can see ALL photocards, even deleted/provisional ones
  sendJsonResponse(res, 200, "Photocard fetched successfully.", {
    photocard,
  });
});

const getDeletedPhotocards = catchAsync(async (req, res) => {
  const deletedPhotocards = await PhotoCard.find({ isDeleted: true })
    .populate("createdBy", "username")
    .sort({ deletedAt: -1 });

  sendJsonResponse(res, 200, "Deleted photocards fetched successfully.", {
    deletedPhotocards,
  });
});

// --- Action Functions ---

const unflagPhotocard = catchAsync(async (req, res, next) => {
  const photocard = await PhotoCard.findById(req.params.id);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  // Set flag to false and save
  photocard.flagged = false;
  await photocard.save();

  // Consolidate report logic
  await resolvePendingReports(photocard._id, req.user._id);

  sendJsonResponse(
    res,
    200,
    "Photocard unflagged and related reports resolved successfully.",
    { photocard }
  );
});

const blockPhotocard = catchAsync(async (req, res, next) => {
  const photocard = await PhotoCard.findById(req.params.id);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  // Update photocard status
  photocard.blocked = true;
  photocard.flagged = true;
  await photocard.save();

  // Check for pending reports. If none, create a system report
  const hasPendingReports = await Report.exists({
    photocard: photocard._id,
    status: "pending",
  });

  if (!hasPendingReports) {
    await Report.create({
      reportedBy: req.user._id,
      reportType: "photocard",
      photocard: photocard._id,
      reasonType: "other",
      reason: "Photocard blocked by admin.",
      status: "resolved",
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    });
  } else {
    // Consolidate report logic
    await resolvePendingReports(
      photocard._id,
      req.user._id,
      "Photocard blocked by admin."
    );
  }

  sendJsonResponse(
    res,
    200,
    "Photocard has been blocked and related reports resolved."
  );
});

const unblockPhotocard = catchAsync(async (req, res, next) => {
  const photocard = await PhotoCard.findById(req.params.id);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  photocard.blocked = false;
  await photocard.save();

  sendJsonResponse(res, 200, "Photocard has been unblocked.", { photocard });
});

const restoreDeletedPhotocard = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const photocard = await PhotoCard.findById(id);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  if (!photocard.isDeleted) {
    return next(new AppError("Photocard is not deleted.", 400));
  }

  //Restore the photocard
  photocard.isDeleted = false;
  photocard.deletedAt = null;
  await photocard.save();

  sendJsonResponse(res, 200, "Photocard restored successfully.", { photocard });
});

const deletePhotocardPermanently = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const photocard = await PhotoCard.findById(id);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  if (!photocard.isDeleted) {
    return next(
      new AppError(
        "Photocard must be soft-deleted before permanent deletion. Please soft-delete it first.",
        400
      )
    );
  }

  /*const timeSinceDeletion = new Date() - new Date(photocard.deletedAt);
  const minDeletionTime = 24 * 60 * 60 * 1000; // 24 hrs

  if (timeSinceDeletion < minDeletionTime) {
    return next(
      new AppError(
        "Photocard was deleted recently. Please wait 24 hours before permanent deletion.",
        400
      )
    );
  }*/

  await PhotoCard.findByIdAndDelete(id);

  sendJsonResponse(res, 200, "Photocard permanently deleted successfully.");
});

// --- Duplicate Functions ---

const getDuplicatePhotocards = catchAsync(async (req, res) => {
  const confirmedDuplicates = await PhotoCard.find({
    isConfirmedDuplicate: true,
  })
    .withCreatorDetails()
    .sort({ createdAt: -1 });

  const pendingDuplicateReports = await Report.find({
    reasonType: "duplicate",
    status: "pending",
  }).select("photocard");

  const suspectedDuplicateIds = pendingDuplicateReports.map(
    (report) => report.photocard
  );

  const suspectedDuplicates = await PhotoCard.find({
    _id: { $in: suspectedDuplicateIds },
    isConfirmedDuplicate: false,
  })
    .withCreatorDetails()
    .sort({ createdAt: -1 });

  const allDuplicatesMap = new Map();
  [...confirmedDuplicates, ...suspectedDuplicates].forEach((photocard) => {
    allDuplicatesMap.set(photocard._id.toString(), photocard);
  });

  const allDuplicatePhotocards = Array.from(allDuplicatesMap.values());

  sendJsonResponse(res, 200, "Duplicate photocards fetched successfully.", {
    photocards: allDuplicatePhotocards,
  });
});

const getDuplicateComparison = catchAsync(async (req, res, next) => {
  const duplicatePhotocard = await PhotoCard.findById(req.params.id)
    .populate("duplicateOf")
    .withCreatorDetails();

  if (!duplicatePhotocard) {
    return next(new AppError("No photocard found with that ID.", 404));
  }

  if (!duplicatePhotocard.duplicateOf) {
    return next(
      new AppError("This photocard is not a confirmed duplicate.", 400)
    );
  }

  const originalPhotocard = await PhotoCard.findById(
    duplicatePhotocard.duplicateOf
  ).withCreatorDetails();

  sendJsonResponse(
    res,
    200,
    "Duplicate comparison data fetched successfully.",
    { duplicatePhotocard, originalPhotocard }
  );
});

const getSuspectedDuplicateComparison = catchAsync(async (req, res, next) => {
  const { duplicateId, originalId } = req.params;

  const [duplicatePhotocard, originalPhotocard] = await Promise.all([
    PhotoCard.findById(duplicateId).withCreatorDetails(),
    PhotoCard.findById(originalId).withCreatorDetails(),
  ]);

  if (!duplicatePhotocard || !originalPhotocard) {
    return next(new AppError("One or both photocards not found.", 404));
  }

  sendJsonResponse(
    res,
    200,
    "Suspected duplicate comparison data fetched successfully.",
    { duplicatePhotocard, originalPhotocard }
  );
});

const confirmDuplicate = catchAsync(async (req, res, next) => {
  const { duplicatePhotocardId, originalPhotocardId } = req.body;

  if (!duplicatePhotocardId || !originalPhotocardId) {
    return next(
      new AppError("Missing duplicate or original photocard ID.", 400)
    );
  }

  const [duplicatePhotocard, originalPhotocard] = await Promise.all([
    PhotoCard.findById(duplicatePhotocardId),
    PhotoCard.findById(originalPhotocardId),
  ]);

  if (!duplicatePhotocard || !originalPhotocard) {
    return next(new AppError("One or both photocards not found.", 400));
  }

  duplicatePhotocard.isConfirmedDuplicate = true;
  duplicatePhotocard.duplicateOf = originalPhotocardId;
  duplicatePhotocard.flagged = false;
  await duplicatePhotocard.save();

  // Consolidate report logic
  await resolvePendingReports(duplicatePhotocardId, req.user._id);

  sendJsonResponse(
    res,
    200,
    "Photocard confirmed as duplicate and reports resolved.",
    { photocard: duplicatePhotocard }
  );
});

const unflagDuplicate = catchAsync(async (req, res, next) => {
  const { id: photocardId } = req.params;

  const updatedPhotocard = await PhotoCard.findByIdAndUpdate(
    photocardId,
    {
      $set: { flagged: false, isConfirmedDuplicate: false, duplicateOf: null },
    },
    { new: true, runValidators: true }
  );

  if (!updatedPhotocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  // Consolidate report logic
  await resolvePendingReports(
    photocardId,
    req.user._id,
    "Admin marked as not a duplicate."
  );

  sendJsonResponse(
    res,
    200,
    "Photocard unmarked as duplicate and related reports resolved.",
    { photocard: updatedPhotocard }
  );
});

// --- EXPORTS ---
module.exports = {
  // Public
  getAllPhotocards,
  getPhotocard,
  searchPhotocards,
  checkExistingPhotocards,
  getPotentialDuplicates,

  // Authenticated
  createPhotocard,
  getUserPhotocards,
  updatePhotocard,
  softDeletePhotocard,

  // Admin
  getPhotocardCounts,
  getPhotocardsByStatus,
  getPhotocardAdmin,
  getDeletedPhotocards,
  unflagPhotocard,
  blockPhotocard,
  unblockPhotocard,
  restoreDeletedPhotocard,
  deletePhotocardPermanently,
  getDuplicatePhotocards,
  getDuplicateComparison,
  getSuspectedDuplicateComparison,
  confirmDuplicate,
  unflagDuplicate,
};
