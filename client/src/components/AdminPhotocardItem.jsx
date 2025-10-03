// AdminPhotocardItem.jsx
// --- IMPORTS ---
import { memo } from "react";
import PropTypes from "prop-types";
import Photocard from "./Photocard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClone,
  faFlag,
  faBan,
  faTrashRestore,
  faTrashCan,
  faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { formatPhotocardNumber } from "../utils/photocardUtils";

const AdminPhotocardItem = memo(function AdminPhotocardItem({
  photocard,
  user,
  onPhotocardClick,
  onBlock,
  onUnblock,
  onRestore,
  onDelete,
  onViewReport,
  onViewDuplicates,
  isProcessingAction,
  isDeleted = false,
}) {
  const isBlocked = photocard.blocked || false;
  const isFlagged = photocard.flagged || false;

  const shouldShowReport =
    isDeleted &&
    (photocard.deleteReason === "rejected_identification" ||
      photocard.deleteReason === "restored_original" ||
      photocard.deleteReason === "deleted_by_admin" ||
      photocard.deleteReason === "replaced_by_identification" ||
      photocard.flagged);

  // Function to determine which buttons to show
  const renderActions = () => {
    if (isDeleted) {
      return (
        <>
          {shouldShowReport && onViewReport && (
            <button
              className="action-button view-report-button"
              onClick={(e) => {
                e.stopPropagation();
                onViewReport(photocard._id);
              }}
              title="View deletion report and comments"
              disabled={isProcessingAction}
            >
              <FontAwesomeIcon icon={faFileAlt} /> View Report
            </button>
          )}
          <button
            className="action-button restore-button"
            onClick={(e) => {
              e.stopPropagation();
              onRestore(photocard._id);
            }}
            title="Restore this photocard from soft-deleted."
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon={faTrashRestore} /> Restore
          </button>
          <button
            className="action-button delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photocard._id);
            }}
            title="Permanently delete this photocard"
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon={faTrashCan} /> Delete Permanently
          </button>
        </>
      );
    } else {
      return (
        <>
          {isBlocked ? (
            <button
              className="action-button unblock-button"
              onClick={(e) => {
                e.stopPropagation();
                onUnblock(photocard._id);
              }}
              disabled={isProcessingAction}
              title="Unblock photocard"
            >
              <FontAwesomeIcon icon="check-circle" /> Unblock
            </button>
          ) : (
            <button
              className="action-button block-button"
              onClick={(e) => {
                e.stopPropagation();
                onBlock(photocard._id);
              }}
              disabled={isProcessingAction}
              title="Block photocard from gallery"
            >
              <FontAwesomeIcon icon="ban" /> Block
            </button>
          )}

          <button
            className="action-button delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photocard._id);
            }}
            title="Soft-delete this photocard."
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon={faTrashCan} /> Delete
          </button>
          {isFlagged && onViewReport && (
            <button
              className="action-button view-report-button"
              onClick={(e) => {
                e.stopPropagation();
                onViewReport(photocard._id, "photocard");
              }}
              title="View latest report details for this photocard."
              disabled={isProcessingAction}
            >
              <FontAwesomeIcon icon={faFlag} /> View Report
            </button>
          )}
        </>
      );
    }
  };

  return (
    <div
      key={photocard._id}
      className={`admin-photocard-item ${isDeleted ? "deleted" : ""}`}
    >
      <div className="photocard-details">
        <div
          className="photocard-click-area"
          onClick={() => onPhotocardClick(photocard._id)}
        >
          <Photocard photocard={photocard} currentUser={user} />
        </div>
        <div className="meta-info">
          {photocard.photocardNumber && (
            <p className="photocard-number">
              <strong>
                {formatPhotocardNumber(photocard.photocardNumber)}
              </strong>
            </p>
          )}
          {photocard.createdBy?.username && (
            <p className="created-by">
              Uploaded by:{" "}
              <Link to={`/admin/users/${photocard.createdBy._id}`}>
                {photocard.createdBy.username}
              </Link>
            </p>
          )}
          {photocard.deletedAt && (
            <p className="deleted-at">
              Deleted:{" "}
              {new Date(photocard.deletedAt).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>
      <div className="photocard-actions-area">
        {photocard.isDuplicate && (
          <button
            className="action-button view-duplicates-button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDuplicates(photocard._id);
            }}
            title="View duplicates and original photocards."
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon={faClone} /> View Duplicates
          </button>
        )}
        {renderActions()}
      </div>
    </div>
  );
});

AdminPhotocardItem.propTypes = {
  photocard: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  onPhotocardClick: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  onUnblock: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewReport: PropTypes.func,
  onViewDuplicates: PropTypes.func,
  isProcessingAction: PropTypes.bool.isRequired,
  isDeleted: PropTypes.bool,
};

export default AdminPhotocardItem;
