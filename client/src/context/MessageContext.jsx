//MessageContext.jsx
import { createContext, useContext, useState, useCallback } from "react";
import { useToast } from "./ToastContext";
import ConfirmationModal from "../modals/ConfirmationModal";
import MessageModal from "../modals/MessageModal";

const MessageContext = createContext(null);

export const MessageProvider = ({ children }) => {
  const { showToast } = useToast();

  const [messageModalContent, setMessageModalContent] = useState({
    title: "",
    message: "",
    type: "info",
  });
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [confirmModalContent, setConfirmModalContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // --- MESSAGE MODAL HANDLERS ---
  /**
   * @param {string} title - Message Title
   * @param {string} message - Message Content
   * @param {'info' | 'success' | 'error' | 'warning'} [type='info'] - Message Type
   */

  const openMessage = useCallback((title, message, type = "info") => {
    setMessageModalContent({ title, message, type });
    setShowMessageModal(true);
  }, []);

  const closeMessage = useCallback(() => {
    setShowMessageModal(false);
    setMessageModalContent({ title: "", message: "", type: "info" });
  }, []);

  // --- CONFIRMATION MODAL HANDLERS ---
  /**
   * @param {string} title - Confirmation Message Title
   * @param {string} message - Confirmation Message
   * @param {function} onConfirmCallback - Function to execute if confirmed
   * @param {function} [onCancelCallback=() => {}] - Function to execute if cancelled
   * @param {string } [confirmText='Confirm'] - Confirm Button Text
   * @param {string} [cancelText='Cancel'] - Cancel Button Text
   */

  const openConfirm = useCallback(
    (
      title,
      message,
      onConfirmCallback,
      onCancelCallback = () => {},
      confirmText = "Confirm",
      cancelText = "Cancel"
    ) => {
      setConfirmModalContent({
        title,
        message,
        onConfirm: () => {
          setShowConfirmModal(false);
          if (onConfirmCallback) onConfirmCallback();
        },
        onCancel: () => {
          setShowConfirmModal(false);
          if (onCancelCallback) onCancelCallback();
        },
        confirmText,
        cancelText,
      });
      setShowConfirmModal(true);
    },
    []
  );

  const closeConfirm = useCallback(() => {
    setShowConfirmModal(false);
    setConfirmModalContent({
      title: "",
      message: "",
      onConfirm: () => {},
      onCancel: () => {},
      confirmText: "Confirm",
      cancelText: "Cancel",
    });
  }, []);

  // --- CONTEXT VALUE ---
  const contextValue = {
    showToast,
    openMessage,
    closeMessage,
    openConfirm,
    closeConfirm,
  };

  return (
    <MessageContext.Provider value={contextValue}>
      {children}
      <MessageModal
        isOpen={showMessageModal}
        title={messageModalContent.title}
        message={messageModalContent.message}
        type={messageModalContent.type}
        onClose={closeMessage}
      />
      <ConfirmationModal
        isOpen={showConfirmModal}
        title={confirmModalContent.title}
        message={confirmModalContent.message}
        onConfirm={confirmModalContent.onConfirm}
        onCancel={confirmModalContent.onCancel}
        confirmText={confirmModalContent.confirmText}
        cancelText={confirmModalContent.cancelText}
      />
    </MessageContext.Provider>
  );
};

export const useMessage = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error("useMessage must be used within a MessageProvider.");
  }
  return context;
};
