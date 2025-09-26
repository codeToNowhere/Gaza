//AdminPhotocardItem.js
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
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { formatPhotocardNumber } from "../utils/photocardUtils";

const AdminPhotocardItem = memo(function AdminPhotocardItem({
  photocard,
  user,
  onPhotocardClick,
  onBlock,
  onRestore,
  onDelete,
  onViewReport,
  onViewDuplicates,
  isProcessingAction,
  isDeleted, // NEW PROP
}) {
  // Function to determine which buttons to show
  const renderActions = () => {
    if (isDeleted) {
      return (
        <>
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
            title="Permanently delete this photocard."
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon={faTrashCan} /> Delete Permanently
          </button>
        </>
      );
    } else {
      return (
        <>
          <button
            className={`action-button ${
              photocard.blocked ? "unblock-button" : "block-button"
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onBlock(photocard._id);
            }}
            title={
              photocard.blocked
                ? "Unblock this photocard."
                : "Block this photocard."
            }
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon={faBan} />{" "}
            {photocard.blocked ? "Unblock" : "Block"}
          </button>
          {photocard.flagged && (
            <button
              className="action-button unflag-button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(photocard._id);
              }}
              title="Unflag this photocard."
              disabled={isProcessingAction}
            >
              <FontAwesomeIcon icon={faFlag} /> Unflag
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
              <strong># {photocard.photocardNumber}</strong>
            </p>
          )}
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
        {photocard.flagged && onViewReport && (
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
      </div>
    </div>
  );
});

AdminPhotocardItem.propTypes = {
  photocard: PropTypes.object.isRequired,
  user: PropTypes.object.isRequired,
  onPhotocardClick: PropTypes.func.isRequired,
  onBlock: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewReport: PropTypes.func,
  onViewDuplicates: PropTypes.func,
  isProcessingAction: PropTypes.bool.isRequired,
  isDeleted: PropTypes.bool,
};

export default AdminPhotocardItem;
