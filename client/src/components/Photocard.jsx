// Photocard.jsx
// --- IMPORTS ---
import { useState, useRef, useMemo, useCallback, useEffect, memo } from "react";
import { useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import {
  getBorderClass,
  getLabelClass,
  getPhotocardImageSrc,
  getStatusLabel,
} from "../utils/photocardUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFlag as fasFlag } from "@fortawesome/free-solid-svg-icons";
import { faFlag as farFlag } from "@fortawesome/free-regular-svg-icons";
import "../styles/components/Photocard.css";

const Photocard = memo(function Photocard({
  photocard,
  onClick,
  onOpenReportModal,
  currentUser,
  onIdentify,
}) {
  // --- HOOKS & STATE MANAGEMENT ---
  const { user } = useAuth();
  const { openMessage } = useMessage();
  const imageRef = useRef();
  const timer = useRef(null);

  const [showPrompt, setShowPrompt] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);

  const isFlagged = photocard.flagged || false;
  const isBlocked = photocard.blocked || false;
  const status = getStatusLabel(photocard);
  const borderClass = getBorderClass(status);
  const isOwner =
    user && photocard.createdBy && photocard.createdBy._id === user.id;

  // --- HANDLERS ---
  const handleMouseEnter = useCallback(() => {
    timer.current = setTimeout(() => setShowPrompt(true), 1000);
  }, []);

  const handleMouseLeave = useCallback(() => {
    clearTimeout(timer.current);
    setShowPrompt(false);
  }, []);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const handleFlag = useCallback(
    (e) => {
      e.stopPropagation();

      if (!user) {
        openMessage(
          "Flagging Error",
          "You must be logged in to flag a photocard.",
          "error"
        );
        return;
      }

      if (isOwner) {
        openMessage(
          "Flagging Error",
          "You cannot flag your own photocard!",
          "error"
        );
        return;
      }

      if (isFlagged) {
        openMessage(
          "Flagging Error",
          "This photocard is already flagged and awaiting moderation.",
          "error"
        );
        return;
      }

      if (onOpenReportModal) {
        onOpenReportModal(photocard);
      }
    },
    [user, isOwner, isFlagged, onOpenReportModal, photocard, openMessage]
  );

  // --- HOOKS ---
  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  // Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadImage(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px", threshold: 0.01 }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const imageSrc = getPhotocardImageSrc(photocard);

  // --- RENDER ---
  return (
    <div className="photocard-wrapper">
      <div
        className="photocard"
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyPress}
      >
        <div ref={imageRef} className={`photocard-container ${borderClass}`}>
          {shouldLoadImage ? (
            <img
              src={imageSrc}
              alt="Uploaded"
              decoding="async"
              width="250"
              height="350"
            />
          ) : (
            <div className="image-placeholder">Loading...</div>
          )}

          <div className={`photocard-label ${getLabelClass(status)}`}>
            {status}
          </div>
        </div>
        {photocard.name && (
          <div className="photocard-name">{photocard.name}</div>
        )}{" "}
        {showPrompt && <div className="photocard-prompt">Click for bio:</div>}
      </div>

      {isOwner ? (
        <div className="owner-status-indicators">
          {isFlagged && (
            <div className="flagged-indicator">
              <FontAwesomeIcon icon={fasFlag} className="flag-icon" />{" "}
              <span>Flagged for Review</span>
              {photocard.flaggedReasonType === "duplicate" && (
                <span className="flag-reason-detail">(Possible Duplicate)</span>
              )}
            </div>
          )}{" "}
          {isBlocked && (
            <div className="blocked-indicator">
              <FontAwesomeIcon icon="ban" className="blocked-icon" />
              <span>Blocked by Admin</span>
            </div>
          )}
        </div>
      ) : (
        user &&
        onOpenReportModal && (
          <button
            className={`flag-toggle-button ${isFlagged ? "flagged" : ""}`}
            onClick={handleFlag}
            title={
              isFlagged
                ? "Photocard is flagged"
                : "Flag this photocard for review"
            }
            disabled={isFlagged}
          >
            <FontAwesomeIcon icon={isFlagged ? fasFlag : farFlag} />{" "}
            {isFlagged ? "Flagged" : "Flag"}
          </button>
        )
      )}

      {photocard.isUnidentified && currentUser && !currentUser.isBlocked && (
        <button
          className="identify-button"
          onClick={() => onIdentify(photocard)}
          title="I know this person"
        >
          Identify
        </button>
      )}
    </div>
  );
});

export default Photocard;
