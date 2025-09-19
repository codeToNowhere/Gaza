// useModalAccessibility.js
import { useEffect, useRef } from "react";

const focusableSelector =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export const useModalAccessibility = (isOpen, modalRef, onClose) => {
  const lastFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      if (lastFocusedElementRef.current) {
        lastFocusedElementRef.current.focus();
      }
      return;
    }

    lastFocusedElementRef.current = document.activeElement;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab") {
        const focusableElements =
          modalRef.current.querySelectorAll(focusableSelector);
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Initial focus on the first focusable element
    const focusableElements =
      modalRef.current.querySelectorAll(focusableSelector);
    if (focusableElements.length > 0) {
      // You can add logic here for specific default focus, like the confirm button
      const confirmButton = Array.from(focusableElements).find((el) =>
        el.classList.contains("confirm-btn")
      );
      if (confirmButton) {
        confirmButton.focus();
      } else {
        focusableElements[0].focus();
      }
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, modalRef, onClose]);
};
