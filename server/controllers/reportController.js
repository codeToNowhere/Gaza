//reportController.js
const PhotoCard = require("../models/PhotoCard");
const Report = require("../models/Report");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const {
  resolvePendingReports,
  flagReportedItem,
} = require("../utils/reportHelpers");
const { sendJsonResponse } = require("../utils/responseHelpers");

const createReport = catchAsync(async (req, res, next) => {
  const { itemId, reportType, reason, reasonType, duplicateOfId } = req.body;
  const reportedBy = req.user._id;

  if (!itemId || !reportType || !reason || !reasonType) {
    return next(
      new AppError(
        "Please provide all required fields: itemId, reportType, reason, reasonType.",
        400
      )
    );
  }

  let reportedItemRef;
  let reportItemModel;

  if (reportType === "photocard") {
    reportedItemRef = await PhotoCard.findById(itemId);
    reportItemModel = "PhotoCard";
  } else if (reportType === "user") {
    reportedItemRef = await User.findById(itemId);
    reportItemModel = "User";
  } else {
    return next(
      new AppError('Invalid reportType. Must be "photocard" or "user".', 400)
    );
  }

  if (!reportedItemRef) {
    return next(new AppError(`${reportItemModel} not found.`, 404));
  }

  let duplicatePhotocardRef = null;
  if (reasonType === "duplicate" && duplicateOfId && duplicateOfId !== "none") {
    duplicatePhotocardRef = await PhotoCard.findById(duplicateOfId);
    if (!duplicatePhotocardRef) {
      return next(
        new AppError("Duplicate photocard reference not found.", 404)
      );
    }
  }

  const reportData = {
    reportedBy,
    reportType,
    reason,
    reasonType,
    duplicateOf: duplicatePhotocardRef ? duplicatePhotocardRef._id : null,
  };

  await flagReportedItem(reportedItemRef, reportType);
  if (reportType === "photocard") {
    reportData.photocard = reportedItemRef._id;
  } else {
    reportData.reportedUser = reportedItemRef._id;
  }

  const report = await Report.create(reportData);

  sendJsonResponse(res, 201, "Report submitted successfully.", { report });
});

const getAllReports = catchAsync(async (req, res) => {
  const reports = await Report.find({})
    .withPopulatedFields()
    .sort({ createdAt: -1 });

  sendJsonResponse(res, 200, "Reports fetched successfully.", { reports });
});

const getReportsByItem = catchAsync(async (req, res, next) => {
  const { itemId } = req.params;
  const { itemType } = req.query;

  let query = {};
  let model;

  if (itemType === "photocard") {
    query.photocard = itemId;
    model = PhotoCard;
  } else if (itemType === "user") {
    query.reportedUser = itemId;
    model = User;
  } else {
    return next(
      new AppError('Invalid itemType. Must be "photocard" or "user".', 400)
    );
  }

  const itemExists = await model.findById(itemId);
  if (!itemExists) {
    return next(new AppError(`${itemType} not found.`, 404));
  }

  const reports = await Report.find({ ...query, reportType: itemType })
    .withPopulatedFields()
    .sort({ createdAt: -1 });

  if (!reports || reports.length === 0) {
    return next(new AppError(`No reports found for this ${itemType}.`, 404));
  }

  sendJsonResponse(res, 200, `Reports for ${itemType} fetched successfully.`, {
    reports,
  });
});

const getReportCounts = catchAsync(async (req, res) => {
  const [pendingPhotocardReports, pendingUserReports, totalReports] =
    await Promise.all([
      Report.countDocuments({ reportType: "photocard", status: "pending" }),
      Report.countDocuments({ reportType: "user", status: "pending" }),
      Report.countDocuments(),
    ]);

  sendJsonResponse(res, 200, "Report counts fetched successfully.", {
    counts: { pendingPhotocardReports, pendingUserReports, totalReports },
  });
});

const updateReportStatus = catchAsync(async (req, res, next) => {
  const { reportId } = req.params;
  const { status } = req.body;

  const report = await Report.findById(reportId);
  if (!report) {
    return next(new AppError("Report not found.", 404));
  }

  if (!status || !["reviewed", "resolved", "dismissed"].includes(status)) {
    return next(new AppError("Invalid status provided.", 400));
  }

  report.status = status;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  await report.save();

  sendJsonResponse(res, 200, "Report status updated successfully.", { report });
});

module.exports = {
  createReport,
  getAllReports,
  getReportsByItem,
  getReportCounts,
  updateReportStatus,
};
