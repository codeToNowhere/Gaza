// IdentificationReviewModal.jsx - Updated version
import PropTypes from "prop-types";
import Photocard from "../components/Photocard";
import Spinner from "../components/Spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/modals/Modals.css";
import "../styles/pages/AdminDashboard.css";

const IdentificationReviewModal = ({
  isOpen,
  onClose,
  verificationInfo,
  onApprove,
  onReject,
  isProcessingAction,
  onPhotocardClick,
}) => {
  if (!isOpen) return null;

  if (!verificationInfo) {
    return (
      <div className="modal-overlay">
        <div className="modal-content identification-review-modal-content">
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
          <div className="modal-loading-state">
            <Spinner /> <p>Fetching verification details...</p>
          </div>
        </div>
      </div>
    );
  }

  const { originalPhotocard, provisionalPhotocard, verification } =
    verificationInfo || {};

  const submittedBy = verification?.submittedBy?.username || "Unknown User";
  const submittedDate = verification?.createdAt
    ? new Date(verification.createdAt).toLocaleDateString()
    : "Unknown date";

  return (
    <div className="modal-overlay">
      <div className="modal-content identification-review-modal-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>

        <h2 className="modal-title">Identification Review</h2>

        <div className="verification-meta">
          <p>
            <strong>Submitted by:</strong> {submittedBy}
          </p>
          <p>
            <strong>Submitted on:</strong> {submittedDate}
          </p>
          <p>
            <strong>Status:</strong> Pending Review
          </p>
        </div>

        <div className="identification-comparison-container">
          {/* LEFT: Original Unidentified Photocard */}
          <div className="photocard-comparison-card original-card">
            <h4>Original (Unidentified)</h4>
            {originalPhotocard ? (
              <>
                <div onClick={() => onPhotocardClick(originalPhotocard._id)}>
                  <Photocard photocard={originalPhotocard} showStatus={true} />
                </div>
                <div className="photocard-summary">
                  <p>
                    <strong>Name:</strong> {originalPhotocard.name || "Unknown"}
                  </p>
                  <p>
                    <strong>Age:</strong>{" "}
                    {originalPhotocard.age || "Not specified"}
                  </p>
                  <p>
                    <strong>Condition:</strong>{" "}
                    {originalPhotocard.condition || "Not specified"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="status-badge unidentified">
                      Unidentified
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <p>Original photocard not found.</p>
            )}
          </div>

          {/* RIGHT: Provisional Identified Photocard */}
          <div className="photocard-comparison-card provisional-card">
            <h4>Proposed Identification</h4>
            {provisionalPhotocard ? (
              <>
                <div onClick={() => onPhotocardClick(provisionalPhotocard._id)}>
                  <Photocard
                    photocard={provisionalPhotocard}
                    showStatus={true}
                    isProvisional={true}
                  />
                </div>
                <div className="photocard-summary">
                  <p>
                    <strong>Name:</strong>{" "}
                    {provisionalPhotocard.name || "Unknown"}
                  </p>
                  <p>
                    <strong>Age:</strong>{" "}
                    {provisionalPhotocard.age || "Not specified"}
                  </p>
                  <p>
                    <strong>Condition:</strong>{" "}
                    {provisionalPhotocard.condition || "Not specified"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className="status-badge provisional">
                      Provisional
                    </span>
                  </p>
                  {provisionalPhotocard.biography && (
                    <div className="bio-preview">
                      <strong>Bio Preview:</strong>
                      <p>
                        {provisionalPhotocard.biography.length > 100
                          ? `${provisionalPhotocard.biography.substring(
                              0,
                              100
                            )}...`
                          : provisionalPhotocard.biography}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p>Provisional photocard not found.</p>
            )}
          </div>
        </div>

        {/* Full Biography Display (Collapsible) */}
        {provisionalPhotocard?.biography && (
          <div className="full-bio-section">
            <details>
              <summary>
                <strong>Full Biography</strong> (Click to expand)
              </summary>
              <div className="bio-content">
                {provisionalPhotocard.biography}
              </div>
            </details>
          </div>
        )}

        {/* Admin Actions */}
        <div className="modal-actions">
          <button
            className="modal-btn reject-btn"
            onClick={() => onReject(verification?._id)}
            disabled={isProcessingAction || !verification?._id}
          >
            <FontAwesomeIcon icon="times" />
            Reject Identification
          </button>
          <button
            className="modal-btn approve-btn"
            onClick={() => onApprove(verification?._id)}
            disabled={isProcessingAction || !verification?._id}
          >
            <FontAwesomeIcon icon="check" />
            Approve Identification
          </button>
        </div>
      </div>
    </div>
  );
};

IdentificationReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  verificationInfo: PropTypes.shape({
    originalPhotocard: PropTypes.object,
    verification: PropTypes.object,
  }),
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  isProcessingAction: PropTypes.bool.isRequired,
  onPhotocardClick: PropTypes.func.isRequired,
};

export default IdentificationReviewModal;
