//report.js
const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/", authenticateToken, reportController.createReport);

module.exports = router;
