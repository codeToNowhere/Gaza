// MessageModal.jsx
import ReactDOM from "react-dom";
import { useRef } from "react";
import PropTypes from "prop-types";
import { useModalAccessibility } from "../hooks/useModalAccessibility";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "../styles/modals/Modals.css";
import { text } from "@fortawesome/fontawesome-svg-core";

const MessageModal = ({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
  buttons = [],
}) => {
  const modalRef = useRef(null);
  useModalAccessibility(isOpen, modalRef, onClose);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return "check-circle";
      case "error":
        return "times-circle";
      case "warning":
        return "exclamation-triangle";
      case "info":
      default:
        return "info-circle";
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case "success":
        return "message-modal-success";
      case "error":
        return "message-modal-error";
      case "warning":
        return "message-modal-warning";
      case "info":
      default:
        return "message-modal-info";
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-modal-title"
    >
      <div
        className={`modal-content message-modal ${getTypeClass()}`}
        ref={modalRef}
      >
        <div className="message-modal-header">
          <FontAwesomeIcon icon={getIcon()} className="message-modal-icon" />
          <FontAwesomeIcon icon={getIcon()} className="message-modal-icon" />
          <h2 id="message-modal-title" className="modal-title">
            {title}
          </h2>
        </div>

        <div className="message-modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-actions">
          {buttons.length > 0 ? (
            buttons.map((button, index) => (
              <button
                key={index}
                className="modal-btn confirm-btn"
                onClick={button.onClick}
              >
                {button.text}
              </button>
            ))
          ) : (
            <button className="modal-btn confirm-btn" onClick={handleClose}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

MessageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  type: PropTypes.oneOf(["success", "error", "warning", "info"]),
  onClose: PropTypes.func.isRequired,
  buttons: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
    })
  ),
};

export default MessageModal;
