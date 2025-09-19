// PhotocardActions.jsx
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/components/PhotocardActions.css";

const PhotocardActions = ({
  photocard,
  onBlock,
  onDelete,
  onRestore,
  disabled,
}) => {
  const isBlocked = photocard.blocked === true;
  const isFlagged = photocard.flagged === true;

  return (
    <div className="photocard-actions">
      {(isFlagged || isBlocked) && (
        <button
          className="btn-base btn-restore"
          onClick={() => onRestore(photocard._id)}
          disabled={disabled || isBlocked}
          title={
            isBlocked ? "Unblock first to restore" : "Restore this photocard"
          }
        >
          {disabled ? (
            <>
              Restoring... <span className="spinner-inline"></span>
            </>
          ) : (
            <>
              Restore <FontAwesomeIcon icon="flag-checkered" />
            </>
          )}
        </button>
      )}
      <button
        className={`btn-base btn-block ${isBlocked ? "blocked" : ""}`}
        onClick={() => onBlock(photocard._id)}
        title={isBlocked ? "Unblock photocard" : "Block photocard"}
        disabled={disabled}
      >
        {disabled ? (
          <>
            {isBlocked ? "Unblocking..." : "Blocking..."}{" "}
            <span className="spinner-inline"></span>
          </>
        ) : (
          <>
            {isBlocked ? "Unblock" : "Block"}{" "}
            <FontAwesomeIcon icon={isBlocked ? "check-circle" : "ban"} />
          </>
        )}
      </button>
      <button
        className="btn-base btn-delete"
        onClick={() => onDelete(photocard._id)}
        title="Delete photocard"
        disabled={disabled}
      >
        {disabled ? (
          <>
            Deleting... <span className="spinner-inline"></span>
          </>
        ) : (
          <>
            Delete <FontAwesomeIcon icon="trash" />
          </>
        )}
      </button>
    </div>
  );
};

export default PhotocardActions;
