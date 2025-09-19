// verification.js
const express = require("express");
const router = express.Router();
const verificationController = require("../controllers/verificationController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminOnly");

// USER
router.post(
  "/photocards/:photocardId/identify",
  authenticateToken,
  verificationController.submitIdentification
);

module.exports = router;
