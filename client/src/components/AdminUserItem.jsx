// AdminUserItem.jsx
import { memo } from "react";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const AdminUserItem = memo(function AdminUserItem({
  user,
  currentUser,
  onBlock,
  onUnblock,
  onDelete,
  onViewReport,
  isProcessingAction,
}) {
  const cannotActOnSelf = user._id === currentUser.id;

  return (
    <div key={user._id} className="user-item">
      <div className="user-info">
        <h3>{user.username}</h3>
        <p>Email: {user.email}</p>
        <p>Role: {user.isAdmin ? "Admin" : "User"}</p>
        <p>Blocked: {user.isBlocked ? "Yes" : "No"}</p>
        <p>Flagged Count: {user.flaggedCount}</p>
      </div>
      <div className="user-actions">
        {user.flaggedCount > 0 && onViewReport && (
          <button
            className="action-button view-report-button"
            onClick={() => onViewReport(user._id, "user")}
            title="View Reports for this User"
            disabled={isProcessingAction}
          >
            <FontAwesomeIcon icon="file-alt" /> View Report
          </button>
        )}
        {!user.isAdmin && (
          <>
            <button
              className={`action-button ${
                user.isBlocked ? "unblock-button" : "block-button"
              }`}
              onClick={() =>
                user.isBlocked
                  ? onUnblock(user._id, user.username)
                  : onBlock(user._id, user.username)
              }
              title={user.isBlocked ? "Unblock User" : "Block User"}
              disabled={isProcessingAction || cannotActOnSelf}
            >
              {isProcessingAction &&
                (user.isBlocked ? "Unblocking..." : "Blocking...")}{" "}
              {!isProcessingAction && (user.isBlocked ? "Unblock" : "Block")}{" "}
              {!isProcessingAction && (
                <FontAwesomeIcon
                  icon={user.isBlocked ? "check-circle" : "ban"}
                />
              )}{" "}
              {isProcessingAction && <span className="spinner-inline"></span>}
            </button>
            <button
              className="action-button delete-button"
              onClick={() => onDelete(user._id, user.username)}
              title="Delete User (and all their photos)"
              disabled={isProcessingAction || cannotActOnSelf}
            >
              {isProcessingAction ? "Deleting..." : "Delete"}
              {!isProcessingAction && <FontAwesomeIcon icon="trash" />}
              {isProcessingAction && <span className="spinner-inline"></span>}
            </button>
          </>
        )}
        {user.isAdmin && <p className="admin-tag">Administrator</p>}
        {cannotActOnSelf && (
          <p className="self-action-disabled-tag">(Cannot act on self)</p>
        )}
      </div>
    </div>
  );
});

AdminUserItem.propTypes = {
  user: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired,
  onBlock: PropTypes.func.isRequired,
  onUnblock: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onViewReport: PropTypes.func,
  isProcessingAction: PropTypes.bool.isRequired,
};

export default AdminUserItem;
