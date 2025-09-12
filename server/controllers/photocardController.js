// photocardController.js

const mongoose = require("mongoose");
const PhotoCard = require("../models/PhotoCard");
const Report = require("../models/Report");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
  isRealImage,
  deleteImageFile,
  handleImageUpload,
} = require("../utils/imageHelpers");
const { processImage } = require("../utils/imageProcessor");
const {
  preparePhotocardData,
  duplicatePhotocardsQuery,
} = require("../utils/photocardHelpers");
const { resolvePendingReports } = require("../utils/reportHelpers");
const { sendJsonResponse } = require("../utils/responseHelpers");
const fs = require("fs");

// --- PUBLIC ACTIONS ---
const getAllPhotocards = catchAsync(async (req, res, next) => {
  const photocards = await PhotoCard.find({ blocked: false })
    .withCreatorDetails()
    .sort({ createdAt: -1 });

  let detainedCount = 0;
  let missingCount = 0;
  let deceasedCount = 0;
  let totalCount = 0;

  photocards.forEach((photocard) => {
    if (photocard.isConfirmedDuplicate) {
      return;
    }

    const condition = photocard.condition;

    if (condition === "missing") {
      missingCount++;
    } else if (condition === "deceased") {
      deceasedCount++;
    } else {
      detainedCount++;
    }
    totalCount++;
  });

  sendJsonResponse(res, 200, "Photocards fetched successfully.", {
    photocards,
    counts: {
      missing: missingCount,
      deceased: deceasedCount,
      detained: detainedCount,
      total: totalCount,
    },
  });
});

const getPhotocardById = catchAsync(async (req, res, next) => {
  const photocard = await PhotoCard.findById(
    req.params.id
  ).withCreatorDetails();

  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  if (photocard.blocked) {
    const user = req.user;
    const isOwner =
      user &&
      photocard.createdBy &&
      photocard.createdBy._id.toString() === user._id.toString();
    const isAdmin = user && user.isAdmin;

    if (!isAdmin && !isOwner) {
      return next(new AppError("Photocard is blocked.", 403));
    }
  }
  sendJsonResponse(res, 200, "Photocard fetched successfully.", {
    photocard: photocard,
  });
});

const checkExistingPhotocards = catchAsync(async (req, res, next) => {
  const { name, age } = req.query;

  if (!name) {
    return next(new AppError("A name is required for this check.", 400));
  }

  const query = duplicatePhotocardsQuery(name, age);

  const existingPhotocards = await PhotoCard.find(query).select(
    "_id name age image biography"
  );

  sendJsonResponse(res, 200, "Existing photocards checked successfully.", {
    existingPhotocards,
  });
});

const getPotentialDuplicates = catchAsync(async (res, res, next) => {
  const { name, age, currentPhotocardId } = req.query;

  if (!name) {
    return next(
      new AppError("A name is required for this duplicate check.", 400)
    );
  }

  let query = duplicatePhotocardsQuery(name, age);

  query.blocked = false;

  // Exclude current photocard being reported as a duplicate
  if (
    currentPhotocardId &&
    mongoose.Types.ObjectId.isValid(currentPhotocardId)
  ) {
    query._id = { $ne: currentPhotocardId };
  }

  const photocards = await PhotoCard.find(query)
    .select("_id name age image biography")
    .sort({ createdAt: -1 });

  sendJsonResponse(res, 200, "Potential duplicates fetched successfully.", {
    photocards,
  });
});

// --- AUTHENTICATED ACTIONS ---
const createPhotocard = catchAsync(async (req, res, next) => {
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

  let imageFilename = "";

  // Process image if uploaded
  if (req.file) {
    try {
      imageFilename = await handleImageUpload(req.file);
    } catch (err) {
      return next(new AppError("Failed to process image:", 500, err));
    }
  }

  const photocardData = preparePhotocardData(req, req.body, req.file);

  if (
    photocardData.isConfirmedDuplicate &&
    !mongoose.Types.ObjectId.isValid(photocardData.duplicateOf)
  ) {
    if (imageFilename) {
      deleteImageFile(imageFilename);
    }
    return next(
      new AppError("Invalid original photocard ID provided for duplicate.", 400)
    );
  }

  const newPhotocard = new PhotoCard({
    ...photocardData,
    image: imageFilename,
    createdBy: req.user._id,
  });

  const savedPhotocard = await newPhotocard.save();

  sendJsonResponse(res, 201, "Photocard created successfully.", {
    photocard: {
      id: savedPhotocard._id,
      image: savedPhotocard.image ? "✓" : "✗",
      name: savedPhotocard.name,
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

const deletePhotocard = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const photocardId = req.params.id;

  const photocard = await PhotoCard.findById(photocardId);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  if (
    !photocard.createdBy ||
    photocard.createdBy.toString() !== userId.toString()
  ) {
    return next(new AppError("Not authorized to delete this photocard.", 403));
  }

  if (isRealImage(photocard.image)) {
    deleteImageFile(photocard.image);
  }

  await photocard.deleteOne();
  await Report.deleteMany({ photocard: photocardId });

  sendJsonResponse(
    res,
    200,
    "Photocard and associated reports deleted successfully."
  );
});

// --- ADMIN ACTIONS ---

// --- Query Functions ---

const getPhotocardCounts = catchAsync(async (req, res) => {
  const [flaggedCount, blockedCount, duplicateCount, totalCount] =
    await Promise.all([
      PhotoCard.countDocuments({ flagged: true, blocked: false }),
      PhotoCard.countDocuments({ blocked: true }),
      PhotoCard.countDocuments({ isConfirmedDuplicate: true }),
      PhotoCard.countDocuments({}),
    ]);

  sendJsonResponse(res, 200, "Photocard counts fetched successfully.", {
    counts: {
      flagged: flaggedCount,
      blocked: blockedCount,
      duplicates: duplicateCount,
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
  } else if (status === "flagged-blocked") {
    query = { $or: [{ flagged: true }, { blocked: true }] };
  } else {
    // Return all photocards if no status is specified
    query = {};
  }

  const photocards = await PhotoCard.find(query)
    .withCreatorDetails()
    .sort({ createdAt: -1 });

  sendJsonResponse(res, 200, `Photocards fetched successfully.`, {
    photocards,
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

const deletePhotocardByAdmin = catchAsync(async (req, res, next) => {
  const photocard = await PhotoCard.findById(req.params.id);
  if (!photocard) {
    return next(new AppError("Photocard not found.", 404));
  }

  if (isRealImage(photocard.image)) {
    await deleteImageFile(photocard.image);
  }

  await photocard.deleteOne();
  await Report.deleteMany({ photocard: photocard._id });

  sendJsonResponse(
    res,
    200,
    "Photocard and associated reports deleted successfully."
  );
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
  getPhotocardById,
  checkExistingPhotocards,
  getPotentialDuplicates,

  // Authenticated
  createPhotocard,
  getUserPhotocards,
  updatePhotocard,
  deletePhotocard,

  // Admin
  getPhotocardCounts,
  getPhotocardsByStatus,
  unflagPhotocard,
  blockPhotocard,
  unblockPhotocard,
  deletePhotocardByAdmin,
  getDuplicatePhotocards,
  getDuplicateComparison,
  getSuspectedDuplicateComparison,
  confirmDuplicate,
  unflagDuplicate,
};
