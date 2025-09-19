import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "../styles/modals/Modals.css";
import { getPhotocardImageSrc } from "../utils/photocardUtils";

const DuplicateCheckModal = ({
  isOpen,
  onClose,
  existingPhotocards,
  onConfirmContinue,
  originalFormData,
  onViewExistingPhotocard,
  age,
  months,
}) => {
  const [selectedDuplicateId, setSelectedDuplicateId] = useState(null);

  const displayAge = age
    ? months
      ? `${age} years, ${months} months`
      : `${age} years`
    : "Not specified";

  useEffect(() => {
    if (isOpen) {
      setSelectedDuplicateId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getDisplayAge = (photocard) => {
    if (!photocard.age && !photocard.months) return "Age not specified";

    if (photocard.age && photocard.months) {
      return `${photocard.age} years, ${photocard.months} months`;
    }

    return photocard.age
      ? `${photocard.age} years`
      : `${photocard.months} months`;
  };

  const handleViewExisting = (photocardId) => {
    onViewExistingPhotocard(photocardId);
  };

  const handleConfirm = () => {
    if (selectedDuplicateId) {
      onConfirmContinue(true, selectedDuplicateId);
    }
  };

  const handleProceedAnyway = () => {
    onConfirmContinue(false, null);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content duplicate-check-modal">
        <h2 className="modal-title">Potential Duplicate Photocards(s) Found</h2>
        <p>
          A photocard with the name "<strong>{originalFormData.name}</strong>"
          {originalFormData.age && ` (Age: ${displayAge})`} already exists.
          Please review the existing entries below.
        </p>
        <p>
          Is this the <strong>same person</strong>, or a{" "}
          <strong>different person</strong> with the same name?
        </p>

        <div className="existing-photocards-list">
          {existingPhotocards.map((photocard) => (
            <div key={photocard._id} className="modal-list-item">
              <input
                type="radio"
                id={`duplicate-${photocard._id}`}
                name="duplicateSelection"
                value={photocard._id}
                checked={selectedDuplicateId === photocard._id}
                onChange={() => setSelectedDuplicateId(photocard._id)}
                className="duplicate-radio"
              />
              <label
                htmlFor={`duplicate-${photocard._id}`}
                className="modal-list-details"
              >
                <img
                  src={getPhotocardImageSrc(photocard)}
                  alt={`${photocard.name}`}
                  className="modal-photocard-image"
                />
                <div className="existing-photocard-details">
                  <p>
                    <strong>{photocard.name}</strong>
                  </p>
                  {(photocard.age || photocard.months) && (
                    <p className="existing-photocard-age">
                      Age: {getDisplayAge(photocard)}
                    </p>
                  )}
                  {photocard.biography && (
                    <p className="existing-photocard-bio-snippet">
                      {photocard.biography.substring(0, 100)}{" "}
                      {photocard.biography.length > 100 ? "..." : ""}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => handleViewExisting(photocard._id)}
                    className="modal-btn view-existing-button"
                  >
                    View Full Bio
                  </button>
                </div>
              </label>
            </div>
          ))}
        </div>

        <div className="modal-actions duplicate-buttons">
          <button
            type="button"
            className="modal-btn confirm-duplicate-button"
            onClick={handleConfirm}
            disabled={!selectedDuplicateId}
          >
            Confirm Duplicate (Same Person)
          </button>
          <button
            type="button"
            className="modal-btn proceed-different-button"
            onClick={handleProceedAnyway}
          >
            Proceed Anyway (Different Person)
          </button>
          <button
            type="button"
            className="modal-btn cancel-btn"
            onClick={onClose}
          >
            Cancel Upload
          </button>
        </div>
      </div>
    </div>
  );
};

DuplicateCheckModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  existingPhotocards: PropTypes.array.isRequired,
  onConfirmContinue: PropTypes.func.isRequired,
  originalFormData: PropTypes.shape({
    name: PropTypes.string.isRequired,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    months: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  onViewExistingPhotocard: PropTypes.func.isRequired,
  age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  months: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default DuplicateCheckModal;
