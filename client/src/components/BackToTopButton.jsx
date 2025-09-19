// BackToTopButton.jsx
// --- IMPORTS ---
import { useState, useEffect, useCallback, memo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import "../styles/components/BackToTopButton.css";

const BackToTopButton = memo(function BackToTopButton({
  scrollThreshold = 600,
  className = "",
}) {
  const [showButton, setShowButton] = useState(false);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleScroll = useCallback(() => {
    let timeoutId;
    timeoutId = setTimeout(() => {
      setShowButton(window.scrollY > scrollThreshold);
    }, 100);
  }, [scrollThreshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  // --- RENDER ---
  if (!showButton) {
    return null;
  }

  return (
    <button
      className={`back-to-top-button ${className}`}
      onClick={scrollToTop}
      aria-label="Scroll to top"
      title="Back to Top"
    >
      <FontAwesomeIcon icon={faArrowUp} />
    </button>
  );
});

export default BackToTopButton;
