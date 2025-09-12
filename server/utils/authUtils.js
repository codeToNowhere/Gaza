//authUtils.js
const jwt = require("jsonwebtoken");
const config = require("../config/envConfig");
const AppError = require("./AppError");

// Token Lifespan
const ACCESS_TOKEN_LIFESPAN = "15m";
const REFRESH_TOKEN_LIFESPAN_SESSION = "1hr";
const REFRESH_TOKEN_LIFESPAN_REMEMBER_ME = "30d";

// Common cookie options for refresh tokens
const IS_PRODUCTION = config.getNodeEnv();

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: IS_PRODUCTION,
  sameSite: "Lax",
  path: "/",
};

// Helper to clear refresh token cookie
const clearRefreshTokenCookie = (res) => {
  res.cookie("refreshToken", "loggedout", {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
    secure: REFRESH_COOKIE_OPTIONS.secure,
    sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
    path: REFRESH_COOKIE_OPTIONS.path,
  });
};

// Helper for JWT generation
const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

// Helper for JWT verification
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError("Token has expired! Please log in again.", 401);
    }
    if (err instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid token! Please log in again.", 401);
    }
    // For any other unexpected errors during verification
    throw new AppError("Token verification failed unexpectedly.", 500);
  }
};

module.exports = {
  ACCESS_TOKEN_LIFESPAN,
  REFRESH_TOKEN_LIFESPAN_SESSION,
  REFRESH_TOKEN_LIFESPAN_REMEMBER_ME,
  REFRESH_COOKIE_OPTIONS,
  generateToken,
  verifyToken,
  clearRefreshTokenCookie,
};
