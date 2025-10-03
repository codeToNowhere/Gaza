//admin.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const photocardController = require("../controllers/photocardController");
const reportController = require("../controllers/reportController");
const verificationController = require("../controllers/verificationController");
const { adminOnly } = require("../middleware/adminOnly");
const { authenticateToken } = require("../middleware/authMiddleware");

// --- AUTHENTICATED/ADMIN-ONLY (All routes) ---
router.use(authenticateToken);
router.use(adminOnly);

// --- PHOTOCARD ADMIN ROUTES ---

router.get("/photocards/counts", photocardController.getPhotocardCounts);

router.get(
  "/photocards/duplicates",
  photocardController.getDuplicatePhotocards
);
router.get("/photocards/deleted", photocardController.getDeletedPhotocards);
router.get("/photocards/flagged", photocardController.getFlaggedPhotocard);

router.put("/photocards/:id/block", photocardController.blockPhotocard);
router.put("/photocards/:id/unblock", photocardController.unblockPhotocard);
router.put("/photocards/:id/unflag", photocardController.unflagPhotocard);

router.get(
  "/photocards/compare/:id",
  photocardController.getDuplicateComparison
);
router.get(
  "/photocards/compare-suspected/:duplicateId/:originalId",
  photocardController.getSuspectedDuplicateComparison
);

router.get("/photocards", photocardController.getPhotocardsByStatus);
router.put(
  "/photocards/confirm-duplicate",
  adminOnly,
  photocardController.confirmDuplicate
);
router.put(
  "/photocards/:id/unflag-duplicate",
  photocardController.unflagDuplicate
);

router.put(
  "/photocards/:id/restore",
  photocardController.restoreDeletedPhotocard
);
router.delete(
  "/photocards/:id/soft-delete",
  photocardController.softDeletePhotocardByAdmin
);
router.delete(
  "/photocards/:id",
  photocardController.deletePhotocardPermanently
);

router.get("/photocards/:id", photocardController.getPhotocardAdmin);

// --- VERIFICATION ADMIN ROUTES ---
router.get(
  "/verifications/pending",
  verificationController.getPendingVerifications
);
router.get(
  "/verifications/:verificationId",
  verificationController.getVerificationById
);
router.patch(
  "/verifications/:verificationId/approve",
  verificationController.approveVerification
);
router.patch(
  "/verifications/:verificationId/reject",
  verificationController.rejectVerification
);

// --- USER ADMIN ROUTES ---
router.get("/users/", authController.getAllUsers);
router.put("/users/:userId/block", authController.blockUser);
router.put("/users/:userId/unblock", authController.unblockUser);
router.delete("/users/:userId", authController.deleteUser);
router.get("/users/counts", authController.getUserCounts);

// --- REPORT ADMIN ROUTES ---
router.get("/reports", reportController.getAllReports);
router.get("/reports/:itemId", reportController.getReportsByItem);
router.get("/reports/counts", reportController.getReportCounts);

router.put("/reports/:reportId/status", reportController.updateReportStatus);

// --- EXPORT ---
module.exports = router;
