// BioDisplayModal.jsx
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import Spinner from "../components/Spinner";
import { formatAgeDisplay } from "../utils/formDataUtils";
import {
  getStatusLabel,
  getBorderClass,
  getPhotocardImageSrc,
} from "../utils/photocardUtils";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/modals/Modals.css";

const BioDisplayModal = ({ isOpen, onClose, photocardId, isAdmin }) => {
  const [photocard, setPhotocard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { openMessage } = useMessage();

  useEffect(() => {
    if (isOpen && photocardId) {
      setLoading(true);
      setError(null);
      const fetchPhotocard = async () => {
        try {
          const endpoint = isAdmin
            ? `/admin/photocards/${photocardId}`
            : `/photocards/${photocardId}`;
          const response = await apiClient.get(endpoint);
          if (response.data.success) {
            setPhotocard(response.data.photocard);
          } else {
            setError(
              response.data.message || "Failed to fetch photocard details."
            );
          }
        } catch (err) {
          const errorMessage = getErrorMessage(err, "Failed to load bio.");
          setError(errorMessage);
          openMessage("Error", errorMessage, "error");
        } finally {
          setLoading(false);
        }
      };
      fetchPhotocard();
    }
  }, [isOpen, photocardId, openMessage, isAdmin]);

  useEffect(() => {
    if (!isOpen) {
      setPhotocard(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const imageSrc = getPhotocardImageSrc(photocard);
  const status = photocard ? getStatusLabel(photocard) : "";
  const borderClass = photocard ? getBorderClass(status) : "";

  return (
    <div className="modal-overlay bio-modal-overlay" onClick={onClose}>
      <div
        className="modal-content bio-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : photocard ? (
          <div className="bio-display-modal-content">
            <img
              src={imageSrc}
              alt={`${photocard.name}`}
              className={`bio-modal-image ${borderClass}`}
            />
            <h3 className="modal-title bio-username">{photocard.name}</h3>
            {photocard.createdBy && photocard.createdBy.username && (
              <p className="uploaded-by">
                Uploaded by: <strong>{photocard.createdBy.username}</strong>{" "}
                {photocard.createdBy.isBlocked && (
                  <span className="blocked-user-tag"> (Blocked Account)</span>
                )}
              </p>
            )}
            {photocard.condition ? (
              <p>
                <strong>Condition:</strong> {photocard.condition}
              </p>
            ) : (
              <p></p>
            )}
            <p>
              <strong>Age: </strong>
              {formatAgeDisplay(photocard.age, photocard.months)}
            </p>
            <p>
              <strong>Bio:</strong>
            </p>
            <p className="bio-text">
              {photocard.biography || "No biogrpahy provided."}
            </p>
          </div>
        ) : (
          <p>Photocard details not available</p>
        )}
      </div>
    </div>
  );
};

BioDisplayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  photocardId: PropTypes.string,
  isAdmin: PropTypes.bool,
};

export default BioDisplayModal;
