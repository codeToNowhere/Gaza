//reportHelpers.js

const Report = require("../models/Report");
const mongoose = require("mongoose");

const resolvePendingReports = async (
  photocardId,
  userId,
  reason = "Resolved by admin"
) => {
  await Report.updateMany(
    { photocard: photocardId, status: "pending" },
    {
      $set: {
        status: "resolved",
        reviewedBy: userId,
        reviewedAt: new Date(),
        reason: reason,
      },
    }
  );
};

const flagReportedItem = async (itemRef, reportType) => {
  if (reportType === "photocard") {
    itemRef.flagged = true;
  } else if (reportType === "user") {
    itemRef.flaggedCount = (itemRef.flaggedCount || 0) + 1;
    itemRef.lastFlaggedAt = new Date();
  }
  await itemRef.save();
};

module.exports = { resolvePendingReports, flagReportedItem };
