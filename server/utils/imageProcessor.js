//imageProcessor.js
const sharp = require("sharp");

const processImage = async (imageBuffer, originalName = "unknown") => {
  try {
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      throw new Error("Invalid image buffer provided.");
    }
    console.log(
      `Processing image: ${originalName}, Size: ${imageBuffer.length} bytes`
    );

    const processedBuffer = await sharp(imageBuffer)
      .resize(250, 350, {
        fit: "cover",
        position: "center",
      })
      .jpeg({ quality: 80, progressive: true, mozjpeg: true })
      .toBuffer();

    console.log(
      `Image processed: ${originalName}, Original: ${
        imageBuffer.length
      } bytes, Compressed: ${
        processedBuffer.length
      } bytes, Reduction: ${Math.round(
        (1 - processedBuffer.length / imageBuffer.length) * 100
      )}%`
    );

    return processedBuffer;
  } catch (err) {
    console.error("Image processing error:", err.message);
    throw new Error("Failed to process image: " + err.message);
  }
};

module.exports = { processImage };
