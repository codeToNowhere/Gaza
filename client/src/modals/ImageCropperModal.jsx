// ImageCropperModal.jsx
import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { useToast } from "../context/ToastContext";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import { getCroppedImg } from "../utils/cropImage";
import "../styles/modals/ImageCropperModal.css";

const ImageCropperModal = ({ image, onCancel, onDone, isOpen }) => {
  const modalRef = useRef(null);
  const { showToast } = useToast();

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const onCropComplete = useCallback((croppedArea, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleDone = async () => {
    try {
      if (!croppedAreaPixels) {
        showToast("No crop area selected. Please adjust the image.", "error");
        return;
      }
      const { blob, previewUrl } = await getCroppedImg(
        image,
        croppedAreaPixels
      );
      onDone({ blob, previewUrl });
      showToast("Image cropped successfully!", "success");
    } catch (err) {
      showToast("Cropping failed. Please try again.", "error");
    }
  };

  useModalAccessibility(isOpen, modalRef, onCancel);

  return (
    <div
      className="cropper-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
    >
      <div className="cropper-modal" ref={modalRef}>
        <h2 id="cropper-title" className="cropper-title">
          Crop Image
        </h2>

        <div className="cropper-container">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="zoom-slider"
          aria-label="Zoom"
        />

        <div className="cropper-buttons">
          <button onClick={onCancel} className="btn cancel">
            Cancel
          </button>
          <button onClick={handleDone} className="btn done">
            Done Cropping
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropperModal;
