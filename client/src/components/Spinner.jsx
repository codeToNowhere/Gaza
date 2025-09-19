// Spinner.jsx
import "../styles/components/Spinner.css";
import { memo } from "react";

const Spinner = memo(function Spinner() {
  return (
    <div className="spinner-overlay" aria-live="polite" aria-busy="true">
      <div className="spinner" role="status"></div>
    </div>
  );
});

export default Spinner;
