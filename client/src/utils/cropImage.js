// cropImage.js

export const getCroppedImg = (imageSrc, pixelCrop) => {
  return new Promise((resolve, reject) => {
    if (!pixelCrop) {
      reject(new Error("pixelCrop is null or undefined."));
      return;
    }

    const image = new Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty or blob creation failed."));
          return;
        }

        const previewUrl = URL.createObjectURL(blob);
        resolve({ blob, previewUrl });
      }, "image/jpeg");
    };

    image.onerror = () => {
      reject(new Error("Failed to load image."));
    };
  });
};
