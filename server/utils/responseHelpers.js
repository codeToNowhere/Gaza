//responseHelpers.js

/**
 * Helper function for consistent JSON responses
 * @param {Object} res - The Express response object.
 * @param {number} statusCode - The http status code (e.g. 200, 400, 500).
 * @param {string} message - A description of the response.
 * @param {Object} data - Optional: additional data included in the response.
 * @param {string|null} error - Optional: An error message (err.message)
 */

const sendJsonResponse = (
  res,
  statusCode,
  message,
  data = {},
  error = null
) => {
  const isProduction = process.env.NODE_ENV === "production";

  const responsePayload = {
    success: statusCode >= 200 && statusCode < 300,
    message,
    ...data,
  };

  if (error || !isProduction) {
    responsePayload.error = error;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = { sendJsonResponse };
