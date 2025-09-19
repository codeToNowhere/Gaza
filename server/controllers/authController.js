// authController.js
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const PhotoCard = require("../models/PhotoCard");
const Report = require("../models/Report");
const User = require("../models/User");
const config = require("../config/envConfig");
const AppError = require("../utils/AppError");
const authUtils = require("../utils/authUtils");
const catchAsync = require("../utils/catchAsync");
const { deleteImageFile } = require("../utils/imageHelpers");
const { sendEmail } = require("../utils/mailer");
const { resolvePendingReports } = require("../utils/reportHelpers");
const { sendJsonResponse } = require("../utils/responseHelpers");

const signup = catchAsync(async (req, res, next) => {
  const { username, email, password } = req.body;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    return next(new AppError("Email already in use.", 400));
  }

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return next(new AppError("Username already taken.", 400));
  }

  const hashed = await bcrypt.hash(password, 12);

  const newUser = await User.create({
    username,
    email,
    password: hashed,
    refreshTokenVersion: 0,
  });

  const accessToken = authUtils.generateToken(
    {
      id: newUser._id,
      isAdmin: newUser.isAdmin,
    },
    config.getAccessTokenSecret(),
    authUtils.ACCESS_TOKEN_LIFESPAN
  );

  const refreshToken = authUtils.generateToken(
    {
      id: newUser._id,
      refreshTokenVersion: newUser.refreshTokenVersion,
      rememberMe: false,
    },
    config.getRefreshTokenSecret(),
    authUtils.REFRESH_TOKEN_LIFESPAN_SESSION
  );

  res.cookie("refreshToken", refreshToken, {
    ...authUtils.REFRESH_COOKIE_OPTIONS,
    maxAge: 1 * 60 * 60 * 1000,
  });

  sendJsonResponse(res, 201, "Signup successful.", {
    accessToken,
    user: {
      id: newUser._id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  const user = await User.findOne({ email });
  if (!user || user.isBlocked) {
    return next(
      new AppError("Invalid credentials or account is blocked.", 403)
    );
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(
      new AppError("Invalid credentials or account is blocked.", 403)
    );
  }

  const accessToken = authUtils.generateToken(
    { id: user._id, isAdmin: user.isAdmin },
    config.getAccessTokenSecret(),
    authUtils.ACCESS_TOKEN_LIFESPAN
  );

  let refreshTokenLifespan;
  let cookieMaxAge;

  if (rememberMe) {
    refreshTokenLifespan = authUtils.REFRESH_TOKEN_LIFESPAN_REMEMBER_ME;
    cookieMaxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  } else {
    refreshTokenLifespan = authUtils.REFRESH_TOKEN_LIFESPAN_SESSION;
    cookieMaxAge = 1 * 60 * 60 * 1000; // 1hr
  }

  const refreshToken = authUtils.generateToken(
    {
      id: user._id,
      refreshTokenVersion: user.refreshTokenVersion,
      rememberMe: !!rememberMe,
    },
    config.getRefreshTokenSecret(),
    refreshTokenLifespan
  );

  res.cookie("refreshToken", refreshToken, {
    ...authUtils.REFRESH_COOKIE_OPTIONS,
    maxAge: cookieMaxAge,
  });

  sendJsonResponse(res, 200, "Login successful.", {
    accessToken,
    user: { id: user._id, username: user.username, isAdmin: user.isAdmin },
  });
});

const refreshToken = catchAsync(async (req, res, next) => {
  const refreshTokenCookie = req.cookies.refreshToken;

  if (!refreshTokenCookie) {
    authUtils.clearRefreshTokenCookie(res);
    return next(new AppError("No refresh token provided.", 401));
  }

  const decoded = authUtils.verifyToken(
    refreshTokenCookie,
    config.getRefreshTokenSecret()
  );

  const user = await User.findById(decoded.id);

  if (!user || user.isBlocked) {
    authUtils.clearRefreshTokenCookie(res);
    return next(new AppError("Invalid account or account is blocked.", 403));
  }

  if (decoded.refreshTokenVersion !== user.refreshTokenVersion) {
    authUtils.clearRefreshTokenCookie(res);
    return next(
      new AppError("Refresh token revoked. Please log in again.", 403)
    );
  }

  const newAccessToken = authUtils.generateToken(
    {
      id: user._id,
      isAdmin: user.isAdmin,
    },
    config.getAccessTokenSecret(),
    authUtils.ACCESS_TOKEN_LIFESPAN
  );

  const newRefreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  user.refreshTokenVersion = newRefreshTokenVersion;
  await user.save();

  const isRememberMeToken = decoded.rememberMe;

  const newRefreshToken = authUtils.generateToken(
    {
      id: user._id,
      refreshTokenVersion: newRefreshTokenVersion,
      rememberMe: isRememberMeToken,
    },
    config.getRefreshTokenSecret(),
    isRememberMeToken
      ? authUtils.REFRESH_TOKEN_LIFESPAN_REMEMBER_ME
      : authUtils.REFRESH_TOKEN_LIFESPAN_SESSION
  );

  const newCookieMaxAge = isRememberMeToken
    ? 30 * 24 * 60 * 60 * 1000
    : 1 * 60 * 60 * 1000;

  res.cookie("refreshToken", newRefreshToken, {
    ...authUtils.REFRESH_COOKIE_OPTIONS,
    maxAge: newCookieMaxAge,
  });

  sendJsonResponse(res, 200, "Token refreshed successfully.", {
    accessToken: newAccessToken,
    user: {
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      flaggedCount: user.flaggedCount,
    },
  });
});

const logout = catchAsync(async (req, res) => {
  authUtils.clearRefreshTokenCookie(res);
  if (req.user) {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
      await user.save();
    }
  }

  return sendJsonResponse(res, 200, "Logged out successfully.");
});

const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    console.log(`Forgot password request for non-existent email: ${email}`);
    return sendJsonResponse(
      res,
      200,
      "If an account with that email exists, a password reset link has been sent to your email."
    );
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = Date.now() + 3600000; // 1hr

  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = resetTokenExpires;
  await user.save();

  const resetUrl = `${config.getFrontendUrl()}/reset-password/${resetToken}`;

  const htmlContent = `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>
  <p>Please click on the following link, or paste this into your browser to complete the process:</p>
  <p><a href="${resetUrl}">${resetUrl}</a></p>
  <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  <p>This link will expire in 1 hour.</p>`;

  await sendEmail(user.email, "Password Reset Request", htmlContent);

  console.log("Password reset email sent successfully.");
  sendJsonResponse(
    res,
    200,
    "If an account with that email exists, a password reset link has been sent to your email."
  );
});

const validateResetToken = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Password reset token is invalid or has expired.", 400)
    );
  }
  sendJsonResponse(res, 200, "Token is valid.", { success: true });
});

const resetPassword = catchAsync(async (req, res, next) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new AppError("Password reset token is invalid or has expired.", 400)
    );
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokenVersion = (user.refreshTokenVersion || 0) + 1;
  await user.save();

  sendJsonResponse(res, 200, "Your password has been updated successfully.");
});

const getUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    return next(new AppError("User not found.", 404));
  }

  sendJsonResponse(res, 200, "User profile fetched successfully.", {
    success: true,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      flaggedCount: user.flaggedCount,
    },
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find({}).select("-password");
  sendJsonResponse(res, 200, "Users fetched successfully.", { users });
});

const blockUser = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const userToUpdate = await User.findById(userId);

  if (!userToUpdate) {
    return next(new AppError("User not found.", 404));
  }

  if (
    userToUpdate.isAdmin &&
    userToUpdate._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You cannot block another administrator account!", 403)
    );
  }

  if (userToUpdate._id.toString() === req.user._id.toString()) {
    return next(new AppError("You cannot block your own account.", 403));
  }

  if (userToUpdate.isBlocked) {
    return next(new AppError("User is already blocked.", 400));
  }

  userToUpdate.isBlocked = true;
  userToUpdate.refreshTokenVersion =
    (userToUpdate.refreshTokenVersion || 0) + 1;
  await userToUpdate.save();

  await resolvePendingReports(userId, req.user._id, "User blocked by admin.");

  sendJsonResponse(
    res,
    200,
    `User "${userToUpdate.username}" has been blocked and related reports resolved.`,
    { user: userToUpdate }
  );
});

const unblockUser = catchAsync(async (req, res, next) => {
  const userId = req.params.userId;
  const userToUpdate = await User.findById(userId);

  if (!userToUpdate) {
    return next(new AppError("User not found.", 404));
  }

  if (!userToUpdate.isBlocked) {
    return next(new AppError("User is not blocked.", 400));
  }

  userToUpdate.isBlocked = false;
  await userToUpdate.save();

  sendJsonResponse(
    res,
    200,
    `User "${userToUpdate.username}" has been unblocked.`,
    { user: userToUpdate }
  );
});

const deleteUser = catchAsync(async (req, res, next) => {
  const userIdToDelete = req.params.userId;
  const requestingUserId = req.user._id;

  if (userIdToDelete === requestingUserId.toString()) {
    return next(
      new AppError("Administrator cannot delete their own account.", 403)
    );
  }

  const userToDelete = await User.findById(userIdToDelete);
  if (!userToDelete) {
    return next(new AppError("User not found.", 404));
  }

  if (userToDelete.isAdmin) {
    return next(
      new AppError("Cannot delete another administrator account.", 403)
    );
  }

  const userPhotocards = await PhotoCard.find({ createdBy: userIdToDelete });
  for (const photocard of userPhotocards) {
    if (photocard.image) {
      deleteImageFile(photocard.image);
    }
    await photocard.deleteOne();
  }

  await Report.deleteMany({
    $or: [{ reportedBy: userIdToDelete }, { reportedUser: userIdToDelete }],
  });

  await userToDelete.deleteOne();

  sendJsonResponse(
    res,
    200,
    `User "${userToDelete.username}" and their associated photocards and reports have been deleted.`
  );
});

const getUserCounts = catchAsync(async (req, res) => {
  const total = await User.countDocuments({});
  const blocked = await User.countDocuments({ isBlocked: true });
  const flagged = await Report.countDocuments({
    reportType: "user",
    status: "pending",
  });

  sendJsonResponse(res, 200, "User counts fetched successfully.", {
    success: true,
    counts: { flagged: flagged, blocked: blocked, total: total },
  });
});

const makeMeAdmin = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  if (!user) return next(new AppError("User not found.", 404));

  user.isAdmin = true;
  await user.save();

  sendJsonResponse(res, 200, "You are now an admin.", { userId: user._id });
});

// Export functions
module.exports = {
  signup,
  login,
  refreshToken,
  logout,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getUserProfile,
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getUserCounts,
  makeMeAdmin,
};
