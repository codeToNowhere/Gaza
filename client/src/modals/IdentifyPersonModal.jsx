import { useState } from "react";
import { apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import {
  getInitialPhotocardFormData,
  handlePhotocardFormChange,
} from "../utils/formDataUtils";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/modals/Modals.css";

const IdentifyPersonModal = ({ photocard, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState(
    getInitialPhotocardFormData(photocard)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMonthsField, setShowMonthsField] = useState(
    parseInt(photocard.age || 0) < 3
  );
  const { openMessage } = useMessage();

  const handleChange = handlePhotocardFormChange(setFormData, {
    setShowMonthsField,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      openMessage("Error", "Name is required.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post(
        `/verifications/photocards/${photocard._id}/identify`,
        {
          name: formData.name,
          age: formData.age,
          months: formData.months,
          condition: formData.condition,
          biography: formData.biography,
        }
      );

      if (response.data.success) {
        openMessage(
          "Success",
          "Identification submitted for review!",
          "success"
        );
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        "Failed to submit identification"
      );
      openMessage("Error", errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content identify-modal">
        <div className="modal-title">
          <h2>Identify This Person</h2>
          <button className="modal-close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="identify-form">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter the person's name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="age">Age (years)</label>
            <input
              type="number"
              id="age"
              name="age"
              min="0"
              max="120"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age in years"
            />
          </div>

          {showMonthsField && (
            <div className="form-group">
              <label htmlFor="months">Months</label>
              <select
                id="months"
                name="months"
                value={formData.months}
                onChange={handleChange}
              >
                <option value="">Select months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="condition">Condition</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
            >
              <option value="">Select condition</option>
              <option value="injured">Injured</option>
              <option value="missing">Missing</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="biography">Biography/Details</label>
            <textarea
              id="biography"
              name="biography"
              value={formData.biography}
              onChange={handleChange}
              rows="4"
              placeholder="Any additional information you can provide..."
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="modal-btn cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn confirm-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Identification"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IdentifyPersonModal;
