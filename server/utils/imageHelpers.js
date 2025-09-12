//imageHelpers.js
const path = require("path");
const fs = require("fs");
const { processImage } = require("./imageProcessor");

const UPLOADS_DIR = path.join(__dirname, "../uploads");

/**
 * Returns full or absolute path to an uploaded image file.
 * @param {string} filename - The filename of the image
 * @returns {string} - The full path to the image file
 */

const getImagePath = (filename) => {
  return path.join(UPLOADS_DIR, filename);
};

/**
 * Checks if a given filename represents a real, non-placeholder image
 * Placeholder === "camera-placeholder.png"
 * @param {string} imageFilename - The filename of the image
 * @returns {boolean} - True if it's a real image, false otherwise
 */

const isRealImage = (imageFilename) => {
  return (
    imageFilename &&
    imageFilename !== "camera-placeholder.png" &&
    imageFilename !== ""
  );
};

/**
 * Delete an image file from the uploads directory
 * Log error if deletion fails
 * @param {string} imageFilename - image to delete
 */

const deleteImageFile = async (imageFilename) => {
  if (isRealImage(imageFilename)) {
    const imagePath = getImagePath(imageFilename);
    await fs.unlink(imagePath, (err) => {
      if (err) {
        console.error(`Error deleting image file ${imagePath}:`, err.message);
      } else {
        console.log(`Deleted image file: ${imagePath}`);
      }
    });
  }
};

/**
 * Handle image uploading, processing, and saving.
 * @param {Object} file - The file object from multer
 * @returns {string} - The filename of the processed image.
 */
const handleImageUpload = async (file) => {
  if (!file) return null;

  try {
    const fileBuffer = await fs.promises.readFile(file.path);
    const processedImageBuffer = await processImage(
      fileBuffer,
      file.originalname
    );

    await fs.promises.unlink(file.path);

    const filename = `${Date.now()}-${file.originalname.replace(
      /\.[^/.]+$/,
      ""
    )}.jpg`;
    await fs.promises.writeFile(getImagePath(filename), processedImageBuffer);

    return filename;
  } catch (err) {
    console.error("Image processing failed:", err);
    if (file && fs.existsSync(file.path)) {
      await fs.promises.unlink(file.path);
    }
    throw new Error("Failed to process image.");
  }
};

module.exports = {
  UPLOADS_DIR,
  getImagePath,
  isRealImage,
  deleteImageFile,
  handleImageUpload,
};
