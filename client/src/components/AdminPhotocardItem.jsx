// AdminPhotocardItem.jsx
import { memo } from "react";
import PropTypes from "prop-types";
import Photocard from "./Photocard";
import PhotocardActions from "./PhotocardActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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
}) {
  return (
    <div key={photocard._id} className="admin-photocard-item">
      <div
        className="photocard-click-area"
        onClick={() => onPhotocardClick(photocard._id)}
      >
        <Photocard photocard={photocard} currentUser={user} />
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
            <FontAwesomeIcon icon="clone" /> View Duplicates
          </button>
        )}
        <PhotocardActions
          photocard={photocard}
          onBlock={onBlock}
          onRestore={onRestore}
          onDelete={onDelete}
          disabled={isProcessingAction}
        />{" "}
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
            <FontAwesomeIcon icon="flag" /> View Report
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
};

export default AdminPhotocardItem;
