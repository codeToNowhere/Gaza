//auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authenticate } = require("passport");

// --- PUBLIC ROUTES ---
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.post("/forgot-password", authController.forgotPassword);
router.get("/validate-reset-token/:token", authController.validateResetToken);
router.post("/reset-password", authController.resetPassword);

// --- AUTHENTICATED ROUTES ---
router.get("/user", authenticateToken, authController.getUserProfile);

// ===== TEMP FOR DEVELOPMENT =====
router.post("/make-me-admin", authenticateToken, authController.makeMeAdmin);

// --- EXPORT ---
module.exports = router;
