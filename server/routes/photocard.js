//photocard.js
const express = require("express");
const router = express.Router();
const PhotoCard = require("../models/PhotoCard");
const photocardController = require("../controllers/photocardController");
const { authenticateToken } = require("../middleware/authMiddleware");
const {
  upload,
  uploadErrorHandler,
} = require("../middleware/uploadMiddleware");
const AppError = require("../utils/AppError");
const { sendJsonResponse } = require("../utils/responseHelpers");

// --- PUBLIC ROUTES ---
router.get("/ids", async (req, res, next) => {
  try {
    const photocards = await PhotoCard.find({}, "_id").sort({ createdAt: -1 });
    if (!photocards || photocards.length === 0) {
      return next(new AppError("No photocards found.", 404));
    }
    const ids = photocards.map((photocard) => photocard._id.toString());
    sendJsonResponse(res, 200, "Successfully fetched photocard IDs", { ids });
  } catch (error) {
    next(error);
  }
});

router.get("/", photocardController.getAllPhotocards);
router.get("/check-name", photocardController.checkExistingPhotocards);
router.get("/duplicates", photocardController.getPotentialDuplicates);
router.get("/search", photocardController.searchPhotocards);

// --- AUTHENTICATED ROUTES ---
router.get(
  "/user/mine",
  authenticateToken,
  photocardController.getUserPhotocards
);

router.get("/:id", authenticateToken, photocardController.getPhotocard);

router.post(
  "/",
  authenticateToken,
  upload.single("image"),
  uploadErrorHandler,
  photocardController.createPhotocard
);

router.put(
  "/user/:id",
  authenticateToken,
  upload.single("image"),
  uploadErrorHandler,
  photocardController.updatePhotocard
);

router.delete(
  "/user/:id",
  authenticateToken,
  photocardController.softDeletePhotocard
);

// --- EXPORT ---
module.exports = router;
