//uploadMiddleware.js
const multer = require("multer");
const AppError = require("../utils/AppError");
const { UPLOADS_DIR } = require("../utils/imageHelpers");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s/g, "_");
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Unsupported file type. Only JPG, PNG, and GIF are allowed.",
        400
      )
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = "File upload failed.";
    let statusCode = 400;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File is too large. Max 10MB allowed.";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files uploaded. Only one file is allowed.";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message =
          "Unexpected file field. Ensure the file input name is 'image'.";
        break;
      default:
        message = `An unknown upload limit was exceeded: ${err.code}`;
        break;
    }
    return next(new AppError(message, statusCode));
  } else if (err instanceof AppError) {
    return next(err);
  }

  next(err);
};

module.exports = { upload, uploadErrorHandler };
