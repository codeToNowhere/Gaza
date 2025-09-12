//authMiddleware.js
const User = require("../models/User");
const config = require("../config/envConfig");
const AppError = require("../utils/AppError");
const authUtils = require("../utils/authUtils");
const catchAsync = require("../utils/catchAsync");

const authenticateToken = catchAsync(async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new AppError("Access token missing.", 401));
  }

  const decoded = authUtils.verifyToken(token, config.getAccessTokenSecret());

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    return next(new AppError("User associated with token not found.", 401));
  }

  req.user = user;
  next();
});

module.exports = { authenticateToken };
