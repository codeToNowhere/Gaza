// Toast.jsx
import { useEffect, useState, memo, useCallback } from "react";
import PropTypes from "prop-types";
import "../styles/components/Toast.css";

const Toast = memo(function Toast({
  id,
  message,
  type,
  onClose,
  duration = 5000,
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(() => onClose(id), 300);
  }, [id, onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose]);

  // --- RENDER ---
  return (
    <div
      className={`toast toast-${type} ${isVisible ? "show" : "hide"}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="toast-content">
        <span className="toast-icon">
          {type === "success" && "✔️"}
          {type === "error" && "❌"}
          {type === "info" && "ℹ️"}
          {type === "warning" && "⚠️"}
        </span>
        <p className="toast-message">{message}</p>
      </div>
      <button
        className="toast-close-btn"
        onClick={handleClose}
        aria-label="Close-notification"
      >
        &times;
      </button>
    </div>
  );
});

Toast.propTypes = {
  id: PropTypes.string.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info", "warning"]).isRequired,
  onClose: PropTypes.func.isRequired,
  duration: PropTypes.number,
};

export default Toast;
