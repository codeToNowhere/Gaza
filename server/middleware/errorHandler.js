//errorHandler.js

const AppError = require("../utils/AppError");
const { getNodeEnv } = require("../config/envConfig");

// Development: Detailed Error Messages
const sendErrorDev = (err, res) => {
  console.error("ERROR 💥", err);

  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Production: Generic Error Messages
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
  } else {
    console.error("ERROR 💥", err);
    res.status(500).json({ status: "error", message: "Something went wrong!" });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (getNodeEnv() === "development") {
    sendErrorDev(err, res);
  } else if (getNodeEnv() === "production") {
    sendErrorProd(err, res);
  }
};
