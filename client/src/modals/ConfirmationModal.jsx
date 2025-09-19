// ConfirmationModal.jsx
import { useRef } from "react";
import "../styles/modals/Modals.css";
import { useModalAccessibility } from "../hooks/useModalAccessibility";

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}) => {
  const modalRef = useRef(null);
  useModalAccessibility(isOpen, modalRef, onCancel);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
    >
      <div className="modal-content" ref={modalRef}>
        <h2 id="confirmation-modal-title" className="modal-title">
          {title}
        </h2>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="modal-btn cancel-btn" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="modal-btn confirm-btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
