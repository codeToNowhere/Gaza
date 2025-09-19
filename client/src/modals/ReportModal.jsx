// ReportModal.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import Spinner from "../components/Spinner";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/modals/Modals.css";

const ReportModal = ({
  isOpen,
  onClose,
  photocard,
  isSubmitting: parentIsSubmitting,
  onViewExistingPhotocard,
}) => {
  const [reportType, setReportType] = useState("photocard");
  const [reason, setReason] = useState("");
  const [reasonType, setReasonType] = useState("other");
  const [validationError, setValidationError] = useState("");
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [selectedDuplicateId, setSelectedDuplicateId] = useState(null);
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  const { openMessage } = useMessage();
  const modalRef = useRef(null);

  useModalAccessibility(isOpen, modalRef, onClose);

  useEffect(() => {
    if (isOpen) {
      setReportType("photocard");
      setReason("");
      setReasonType("other");
      setValidationError("");
      setPotentialDuplicates([]);
      setSelectedDuplicateId(null);
      setIsLocalSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const fetchDuplicates = async () => {
      if (isOpen && reasonType === "duplicate" && photocard && photocard.name) {
        setLoadingDuplicates(true);

        try {
          const response = await apiClient.get(
            `/photocards/duplicates?name=${photocard.name}&currentPhotocardId=${photocard._id}`
          );
          const filteredDuplicates = response.data.photocards.filter(
            (p) => p._id !== photocard._id
          );
          setPotentialDuplicates(filteredDuplicates);
        } catch (err) {
          openMessage("Error", "Failed to load potential duplicates.", "error");
          setPotentialDuplicates(false);
        } finally {
          setLoadingDuplicates(false);
        }
      } else {
        setPotentialDuplicates([]);
      }
    };
    fetchDuplicates([]);
  }, [isOpen, reasonType, photocard, openMessage]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setValidationError("");

      if (!reason.trim()) {
        setValidationError("Please provide a reason for the report.");
        return;
      }

      if (
        reportType === "photocard" &&
        reasonType === "duplicate" &&
        !selectedDuplicateId
      ) {
        setValidationError(
          "Please select a duplicate photocard or 'None of these'."
        );
        return;
      }

      setIsLocalSubmitting(true);

      let duplicateOfId = null;
      if (reportType === "photocard" && reasonType === "duplicate") {
        if (selectedDuplicateId === "none") {
          duplicateOfId = null;
        } else {
          duplicateOfId = selectedDuplicateId;
        }
      }

      try {
        const payload = {
          itemId:
            reportType === "photocard"
              ? photocard._id
              : photocard.createdBy._id,
          reportType: reportType,
          reason: reason,
          reasonType: reasonType,
          duplicateOfId: duplicateOfId,
        };

        const response = await apiClient.post("/reports", payload);

        if (response.data.success) {
          openMessage("Success", response.data.message, "success");
          onClose();
        } else {
          openMessage(
            "Error",
            response.data.message || "Failed to submit report.",
            "error"
          );
        }
      } catch (err) {
        const errorMessage = getErrorMessage(
          err,
          "An error occurred while submitting the report."
        );
        openMessage("Error", errorMessage, "error");
      } finally {
        setIsLocalSubmitting(false);
      }
    },
    [
      reportType,
      reason,
      reasonType,
      selectedDuplicateId,
      photocard,
      onClose,
      openMessage,
    ]
  );

  if (!isOpen) return null;

  const uploaderUsername = photocard?.createdBy?.username || "N/A";
  const isPhotocardFlagged = photocard?.flagged;

  const handleReasonTypeChange = (e) => {
    setReasonType(e.target.value);
    setSelectedDuplicateId(null);
  };

  const handleViewExistingPhotocard = (id) => {
    if (onViewExistingPhotocard) {
      onViewExistingPhotocard(id);
    }
  };

  const currentSubmissionState = parentIsSubmitting || isLocalSubmitting;

  return (
    <div
      className="modal-verlay report-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
    >
      <div
        className="modal-content report-modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="report-mondal-title" className="modal-title">
          Report Content
        </h2>
        <button
          className="modal-close-button"
          onClick={onClose}
          disabled={currentSubmissionState}
        >
          &times;
        </button>

        <p>
          You are reporting <strong>{photocard.name}</strong>
        </p>
        {isPhotocardFlagged && (
          <p className="warning-message">This photocard is already flagged.</p>
        )}
        <div className="report-options">
          <label className="modal-list-details">
            <input
              type="radio"
              value="photocard"
              checked={reportType === "photocard"}
              onChange={() => setReportType("photocard")}
              disabled={currentSubmissionState}
            />
            Report Photocard
          </label>
          {photocard.createdBy && photocard.createdBy._id && (
            <label className="modal-list-details">
              <input
                type="radio"
                value="user"
                checked={reportType === "user"}
                onChange={() => setReportType("user")}
                disabled={currentSubmissionState}
              />
              Report User
            </label>
          )}
        </div>

        {reportType === "photocard" && (
          <div className="reason-type-selection">
            <label htmlFor="reasonType">
              <span className="report-reason-type-title">
                <strong>Category of Report</strong>
              </span>
            </label>
            <select
              id="reasonType"
              value={reasonType}
              onChange={handleReasonTypeChange}
              disabled={currentSubmissionState}
            >
              <option value="duplicate">Duplicate Photocard</option>
              <option value="inappropriate">Inappropriate Content</option>
              <option value="misleading">Misleading Information</option>
              <option value="other">Other Reason</option>
            </select>
          </div>
        )}

        {reportType === "photocard" && reasonType === "duplicate" && (
          <div className="duplicate-selection-section">
            <h4>Potential Duplicates:</h4>
            {loadingDuplicates ? (
              <Spinner />
            ) : potentialDuplicates.length > 0 ? (
              <div className="existing-photocards-list">
                {potentialDuplicates.map((duplicatePhotocard) => (
                  <div className="modal-list-item" key={duplicatePhotocard._id}>
                    <input
                      type="radio"
                      id={`duplicate-report-${duplicatePhotocard._id} `}
                      onChange={() =>
                        setSelectedDuplicateId(duplicatePhotocard._id)
                      }
                      className="duplicate-radio"
                      disabled={currentSubmissionState}
                    />
                    <label
                      htmlFor={`duplicate-report-${duplicatePhotocard._id}`}
                      className="modal-list-details"
                    >
                      <img
                        src={getPhotocardImageSrc(duplicatePhotocard)}
                        alt={duplicatePhotocard.name}
                        className="modal-photocard-image"
                      />
                      <div className="exisiting-photocard-details">
                        <p>
                          <strong>{duplicatePhotocard.name}</strong>
                        </p>{" "}
                        {duplicatePhotocard.biography && (
                          <p className="existing-photocard-bio-snippet">
                            {duplicatePhotocard.biography.substring(0, 50)}{" "}
                            {duplicatePhotocard.biography.length > 50
                              ? "..."
                              : ""}
                          </p>
                        )}{" "}
                        <button
                          type="button"
                          onClick={() =>
                            handleViewExistingPhotocard(duplicatePhotocard._id)
                          }
                          className="modal-btn view-existing-button"
                          disabled={currentSubmissionState}
                        >
                          View Full Bio
                        </button>
                      </div>
                    </label>
                  </div>
                ))}

                <div className="modal-list-item">
                  <input
                    type="radio"
                    id="duplicate-report-none"
                    name="duplicateReportSelection"
                    value="none"
                    checked={selectedDuplicateId === "none"}
                    onChange={() => setSelectedDuplicateId("none")}
                    className="duplicate-radio"
                    disabled={currentSubmissionState}
                  />
                  <label
                    htmlFor="duplicate-report-none"
                    className="modal-list-details"
                  >
                    None of these are the duplicate
                  </label>
                </div>
              </div>
            ) : (
              <p>
                No other photocards found with this name. Please select 'None of
                these' if you believe it's a duplicate of something else, or
                select a different report category.
              </p>
            )}
          </div>
        )}

        <div className="reason-section">
          <label htmlFor="reportReason">
            <strong>Reason for Report</strong> (required)
          </label>
          <textarea
            id="reportReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="8"
            cols="40"
            placeholder="Please explain why you are reporting this..."
            required
            disabled={currentSubmissionState}
          />
          {validationError && (
            <p className="error-message">{validationError}</p>
          )}
        </div>

        <div className="modal-actions">
          <button
            type="submit"
            className="modal-btn report-submit-button"
            onClick={handleSubmit}
            disabled={
              currentSubmissionState ||
              (reportType === "photocard" &&
                reasonType === "duplicate" &&
                !selectedDuplicateId) ||
              !reason.trim()
            }
          >
            {" "}
            {currentSubmissionState ? (
              <>
                Submitting... <span className="spinner-inline"></span>
              </>
            ) : (
              "Submit Report"
            )}
          </button>

          <button
            type="button"
            className="modal-btn report-cancel-button"
            onClick={onClose}
            disabled={currentSubmissionState}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

ReportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  photocard: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    flagged: PropTypes.bool,
    createdBy: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired,
    }),
  }),
  isSubmitting: PropTypes.bool,
  onViewExistingPhotocard: PropTypes.func,
};

export default ReportModal;
