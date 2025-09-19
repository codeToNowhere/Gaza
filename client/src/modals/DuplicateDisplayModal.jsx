// DuplicateDisplayModal.jsx
import PropTypes from "prop-types";
import Photocard from "../components/Photocard";
import Spinner from "../components/Spinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/modals/Modals.css";
import "../styles/pages/AdminDashboard.css";

const DuplicateDisplayModal = ({
  isOpen,
  onClose,
  duplicatePhotocardInfo,
  onBlock,
  onDelete,
  onRestore,
  isProcessingAction,
  onConfirmDuplicate,
  onPhotocardClick,
  onNotDuplicate,
}) => {
  if (!isOpen) {
    return null;
  }

  if (!duplicatePhotocardInfo) {
    return (
      <div className="modal-overlay">
        <div className="modal-content duplicate-comparison-modal-content">
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
          <div className="modal-loading-state">
            <Spinner /> <p>Fetching photocard details...</p>
          </div>
        </div>
      </div>
    );
  }

  const { originalPhotocard, duplicatePhotocard } = duplicatePhotocardInfo;

  return (
    <div className="modal-overlay">
      <div className="modal-content duplicate-comparison-modal-content">
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>
        <h2 className="modal-title">Duplicate Photocard Comparison</h2>

        <div className="duplicate-comparison-container">
          <div className="photocard-comparison-card">
            <h4>Original Photocard</h4>
            {originalPhotocard ? (
              <>
                <div onClick={() => onPhotocardClick(originalPhotocard._id)}>
                  <Photocard photocard={originalPhotocard} />
                </div>
                <div className="photocard-actions-area">
                  <button
                    className={`action-button view-report-button ${
                      originalPhotocard.blocked
                        ? "unblock-button"
                        : "block-button"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlock(originalPhotocard._id);
                    }}
                    title={
                      originalPhotocard.blocked
                        ? "Unblock Photocard"
                        : "Block Photocard"
                    }
                    disabled={isProcessingAction}
                  >
                    <FontAwesomeIcon
                      icon={originalPhotocard.blocked ? "check-circle" : "ban"}
                    />
                    {originalPhotocard.blocked
                      ? "Unblock Original"
                      : "Block Original"}
                  </button>
                </div>
              </>
            ) : (
              <p>Original photocard not found.</p>
            )}
          </div>

          <div className="photocard-comparison-card">
            <h4>Flagged Duplicate</h4>
            {duplicatePhotocard ? (
              <>
                <div onClick={() => onPhotocardClick(duplicatePhotocard._id)}>
                  <Photocard photocard={duplicatePhotocard} />
                </div>
                <div className="photocard-actions-area">
                  <button
                    className={`action-button view-report-button ${
                      duplicatePhotocard.blocked
                        ? "unblock-button"
                        : "block-button"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBlock(duplicatePhotocard._id);
                    }}
                    title={
                      duplicatePhotocard.blocked
                        ? "Unblock Photocard"
                        : "Block Photocard"
                    }
                    disabled={isProcessingAction}
                  >
                    <FontAwesomeIcon
                      icon={duplicatePhotocard.blocked ? "check-circle" : "ban"}
                    />
                    {duplicatePhotocard.blocked
                      ? "Unblock Duplicate"
                      : "Block Duplicate"}
                  </button>
                  <button
                    className="action-button delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(duplicatePhotocard._id);
                    }}
                    title="Delete this duplicate photocard"
                    disabled={isProcessingAction}
                  >
                    <FontAwesomeIcon icon="trash" />
                    Delete Duplicate
                  </button>
                </div>
              </>
            ) : (
              <p>Duplicate photocard not found.</p>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            className="modal-btn cancel-btn"
            onClick={() => onNotDuplicate(duplicatePhotocard._id)}
            disabled={isProcessingAction}
          >
            Not a Duplicate
          </button>
          <button
            className="modal-btn confirm-btn"
            onClick={() =>
              onConfirmDuplicate(duplicatePhotocard._id, originalPhotocard._id)
            }
            disabled={isProcessingAction}
          >
            Confirm Duplicate
          </button>
        </div>
      </div>
    </div>
  );
};

DuplicateDisplayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  duplicatePhotocardInfo: PropTypes.shape({
    originalPhotocard: PropTypes.object,
    duplicatePhotocard: PropTypes.object,
  }),
  onBlock: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  isProcessingAction: PropTypes.bool.isRequired,
  onPhotocardClick: PropTypes.func.isRequired,
  onNotDuplicate: PropTypes.func.isRequired,
};

export default DuplicateDisplayModal;
