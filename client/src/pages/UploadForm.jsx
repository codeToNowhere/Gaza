// UploadForm.jsx
// --- IMPORTS ---
// React & Router Hooks
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Context
import { useToast } from "../context/ToastContext";
import { apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
// Components
import BackToTopButton from "../components/BackToTopButton";
import Spinner from "../components/Spinner";
// Modals
import BioDisplayModal from "../modals/BioDisplayModal";
import DuplicateCheckModal from "../modals/DuplicateCheckModal";
import ImageCropperModal from "../modals/ImageCropperModal";
// Utilities
import {
  getInitialPhotocardFormData,
  handlePhotocardFormChange,
} from "../utils/formDataUtils";
import { getErrorMessage } from "../utils/getErrorMessage";
import { formatPhotocardNumber } from "../utils/photocardUtils";
// Styles
import "../styles/modals/Modals.css";
import "../styles/modals/ImageCropperModal.css";
import "../styles/pages/UploadForm.css";

const UploadForm = ({ refreshPhotocards }) => {
  const { photocardId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { openMessage } = useMessage();

  // --- STATE MANAGEMENT ---
  const [formData, setFormData] = useState(getInitialPhotocardFormData());
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMonthsField, setShowMonthsField] = useState(false);

  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [potentialDuplicates, setPotentialDuplicates] = useState([]);
  const [isBioDisplayModalOpen, setIsBioDisplayModalOpen] = useState(false);
  const [bioDisplayModalPhotoId, setBioDisplayModalPhotoId] = useState(null);
  const [isCropperModalOpen, setIsCropperModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);

  // --- EFFECTS ---
  useEffect(() => {
    let isMounted = true;

    async function fetchedPhotocardForEdit() {
      if (!photocardId) {
        if (isMounted) {
          setIsEditing(false);
          setLoading(false);
          setCurrentImageUrl("/camera-placeholder.png");
          setFormData(getInitialPhotocardFormData());
        }
        return;
      }

      if (isMounted) {
        setIsEditing(true);
        setLoading(true);
        setError(null);
      }

      try {
        const response = await apiClient.get(`/photocards/${photocardId}`);
        if (!response.data.success) {
          throw new Error(
            response.data.message || "Failed to fetch photocard for edit."
          );
        }
        const photocardData = response.data.photocard;

        if (isMounted) {
          setFormData({
            ...getInitialPhotocardFormData(photocardData),
            image: null,
            isConfirmedDuplicate: photocardData.isConfirmedDuplicate || false,
            duplicateOf: photocardData.duplicateOf || null,
          });

          // Show months field if age is less than 3 years
          if (parseInt(photocardData.age || 0) < 3) {
            setShowMonthsField(true);
          }

          setCurrentImageUrl(
            photocardData.image
              ? `${import.meta.env.VITE_BACKEND_URL}/uploads/${
                  photocardData.image
                }`
              : "/camera-placeholder.png"
          );
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Error loading photocard!"
          );
          setFormData(getInitialPhotocardFormData());
          setCurrentImageUrl("/camera-placeholder.png");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchedPhotocardForEdit();

    return () => {
      isMounted = false;
    };
  }, [photocardId]);

  // --- HANDLER FUNCTIONS ---
  const handleChange = useCallback(
    handlePhotocardFormChange(setFormData, {
      setShowMonthsField,
      onNameChange: () => {
        setPotentialDuplicates([]);
        setFormData((prev) => ({
          ...prev,
          isConfirmedDuplicate: false,
          duplicateOf: null,
        }));
      },
    }),
    [setShowMonthsField, setPotentialDuplicates, setFormData]
  );

  const handleConditionChange = useCallback((conditionValue) => {
    setFormData((prev) => {
      const newCondition =
        prev.condition === conditionValue ? "" : conditionValue;
      return { ...prev, condition: newCondition };
    });
  }, []);

  const handleImageChange = useCallback((e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setIsCropperModalOpen(true);
        e.target.value = "";
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleRemoveImage = useCallback(() => {
    setFormData((prev) => ({ ...prev, image: null }));
    setCurrentImageUrl("/camera-placeholder.png");
  }, []);

  const handleCancelCrop = useCallback(() => {
    setIsCropperModalOpen(false);
    setImageToCrop(null);
  }, []);

  const handleDoneCropping = useCallback(({ blob, previewUrl }) => {
    setFormData((prev) => ({ ...prev, image: blob }));
    setCurrentImageUrl(previewUrl);
    setIsCropperModalOpen(false);
    setImageToCrop(null);
  }, []);

  const processPhotocardSubmission = useCallback(
    async (finalIsConfirmedDuplicate, selectedDuplicateId) => {
      setIsSubmitting(true);
      setError(null);

      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);

      formDataToSend.append("isUnidentified", formData.isUnidentified);

      formDataToSend.append("age", formData.age || "");
      formDataToSend.append("months", formData.months || "");

      formDataToSend.append("condition", formData.condition);
      formDataToSend.append("biography", formData.biography);

      if (formData.image) {
        formDataToSend.append("image", formData.image, "cropped_image.png");
      } else if (isEditing && currentImageUrl === "/camera-placeholder.png") {
        formDataToSend.append("image", "");
      }

      formDataToSend.append(
        "isConfirmedDuplicate",
        finalIsConfirmedDuplicate.toString()
      );

      if (
        finalIsConfirmedDuplicate &&
        selectedDuplicateId &&
        selectedDuplicateId !== "none"
      ) {
        formDataToSend.append("duplicateOf", selectedDuplicateId);
      } else if (isEditing && !finalIsConfirmedDuplicate) {
        formDataToSend.append("duplicateOf", "");
      }

      try {
        let response;
        if (isEditing) {
          response = await apiClient.put(
            `/photocards/user/${photocardId}`,
            formDataToSend
          );
        } else {
          response = await apiClient.post("/photocards", formDataToSend);
        }

        if (response.data.success) {
          const photocardNumber = response.data.photocard?.photocardNumber;

          const successMessage = isEditing
            ? "Photocard Updated!"
            : `Photocard Uploaded! ID: ${formatPhotocardNumber(
                photocardNumber
              )}`;

          showToast(successMessage, "success");

          if (refreshPhotocards) {
            refreshPhotocards();
          }
          navigate("/my-photocards");
        } else {
          openMessage(
            "Submission Failed!",
            response.data.message || "Photocard operation failed.",
            "error"
          );
          throw new Error(
            response.data.message || "Photocard operation failed."
          );
        }
      } catch (err) {
        const errorMessage = getErrorMessage(err, "Failed to save photocard.");
        setError(errorMessage);
        showToast(`Error: ${errorMessage}`, "error");
        openMessage(
          "Error",
          `Failed to save photocard: ${errorMessage}`,
          "error"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      formData,
      isEditing,
      currentImageUrl,
      photocardId,
      navigate,
      showToast,
      openMessage,
      refreshPhotocards,
    ]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (
      isSubmitting ||
      isDuplicateModalOpen ||
      isBioDisplayModalOpen ||
      isCropperModalOpen
    ) {
      return;
    }

    const nameIsUnknown = formData.name.toLowerCase() === "unknown";
    if (nameIsUnknown && !formData.isUnidentified) {
      showToast(
        "Please check the 'Name is unknown' box if you've entered 'Unknown' in the name field.",
        "warning"
      );
      return;
    }

    // If the user checks the box, we don't need to do the duplicate check
    if (formData.isUnidentified) {
      await processPhotocardSubmission(false, null);
      return;
    }

    if (isEditing) {
      await processPhotocardSubmission(
        formData.isConfirmedDuplicate,
        formData.duplicateOf
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.get(
        `/photocards/check-name?name=${encodeURIComponent(
          formData.name
        )}&age=${encodeURIComponent(
          formData.age || ""
        )}&months=${encodeURIComponent(formData.months || "")}`
      );

      const existingPhotocards = response.data.existingPhotocards ?? [];

      if (response.data.success && existingPhotocards.length > 0) {
        setPotentialDuplicates(existingPhotocards);
        setIsDuplicateModalOpen(true);
      } else {
        setPotentialDuplicates([]);
        setIsDuplicateModalOpen(false);
        await processPhotocardSubmission(false, null);
      }
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        "Failed to check for duplicate photocards."
      );
      setError(errorMessage);
      showToast(`Duplicate check failed: ${errorMessage}`, "error");
      openMessage("Error", `Duplicate check failed: ${errorMessage}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDuplicateChoice = useCallback(
    (isSamePerson, selectedDuplicateId) => {
      setIsDuplicateModalOpen(false);
      setFormData((prev) => ({
        ...prev,
        isConfirmedDuplicate: isSamePerson,
        duplicateOf:
          isSamePerson && selectedDuplicateId !== "none"
            ? selectedDuplicateId
            : null,
      }));
      processPhotocardSubmission(isSamePerson, selectedDuplicateId);
    },
    [processPhotocardSubmission]
  );

  const handleCloseDuplicateModal = useCallback(() => {
    setIsDuplicateModalOpen(false);
    setIsSubmitting(false);
  }, []);

  const handleViewExistingPhotocardInModal = useCallback(
    (photocardIdToDisplay) => {
      setBioDisplayModalPhotoId(photocardIdToDisplay);
      setIsBioDisplayModalOpen(true);
    },
    []
  );

  const handleCloseBioDisplayModal = useCallback(() => {
    setIsBioDisplayModalOpen(false);
    setBioDisplayModalPhotoId(null);
  }, []);

  // --- DERIVED STATE / MEMOIZATION
  const disableForm =
    isSubmitting ||
    loading ||
    isDuplicateModalOpen ||
    isBioDisplayModalOpen ||
    isCropperModalOpen;

  // --- RENDER ---
  return (
    <div className="upload-form-container">
      <h2 className="form-title">
        {isEditing ? "Edit Photocard" : "Upload New Photocard"}
      </h2>

      {loading && isSubmitting && <Spinner />}

      {(!loading || error) && (
        <>
          {error && (
            <p className="error-message" role="alert">
              Error: {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="upload-form">
            <div className="form-group upload-image-container">
              <label htmlFor="image" className="visually-hidden">
                Photocard Image:
              </label>
            </div>
            <input
              type="file"
              id="image"
              name="image"
              onChange={handleImageChange}
              accept="image/*"
              disabled={disableForm}
              aria-describedby="image-upload-help"
            />
            <p id="image-upload-help" className="visually-hidden">
              Upload a photocard image. Accepted formats include JPG, PNG, GIF
            </p>

            {currentImageUrl && (
              <div className="image-preview-wrapper">
                <img
                  src={currentImageUrl}
                  alt="Photocard Preview"
                  className="small-preview"
                />
                {currentImageUrl !== "/camera-placeholder.png" && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="remove-image-btn"
                    disabled={disableForm}
                    aria-label="Remove photocard image"
                  >
                    &times;
                  </button>
                )}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">
                Name:<span aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter name or 'Unknown' if not known"
                disabled={disableForm}
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isUnidentified"
                  checked={formData.isUnidentified}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isUnidentified: e.target.checked,
                    }))
                  }
                  disabled={disableForm}
                />
                Name is unknown
              </label>
              <small className="help-text">
                Check this if person's name is not known
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="age">Age (in years):</label>
              <input
                type="number"
                id="age"
                name="age"
                min="0"
                max="120"
                value={formData.age}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (
                    !/[0-9]/.test(e.key) &&
                    ![
                      "Backspace",
                      "Delete",
                      "Tab",
                      "ArrowLeft",
                      "ArrowRight",
                      "ArrowUp",
                      "ArrowDown",
                    ].includes(e.key)
                  ) {
                    e.preventDefault();
                  }
                }}
                disabled={disableForm}
              />
            </div>

            {showMonthsField && (
              <div className="form-group">
                <label htmlFor="months">Months:</label>
                <select
                  id="months"
                  name="months"
                  value={formData.months}
                  onChange={handleChange}
                  disabled={disableForm}
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
              <label htmlFor="condition-label" className="condition-label">
                Condition:
              </label>
              <div
                className="condition-buttons-container"
                role="group"
                aria-labelledby="condition-label"
              >
                <button
                  type="button"
                  className={`condition-button ${
                    formData.condition === "injured" ? "selected" : ""
                  }`}
                  onClick={() => handleConditionChange("injured")}
                  disabled={disableForm}
                  aria-pressed={
                    formData.condition === "injured" ? "true" : "false"
                  }
                >
                  Injured
                </button>
                <button
                  type="button"
                  className={`condition-button ${
                    formData.condition === "missing" ? "selected" : ""
                  }`}
                  onClick={() => handleConditionChange("missing")}
                  disabled={disableForm}
                  aria-pressed={
                    formData.condition === "missing" ? "true" : "false"
                  }
                >
                  Missing
                </button>
                <button
                  type="button"
                  className={`condition-button ${
                    formData.condition === "deceased" ? "selected" : ""
                  }`}
                  onClick={() => handleConditionChange("deceased")}
                  disabled={disableForm}
                  aria-pressed={
                    formData.condition === "deceased" ? "true" : "false"
                  }
                >
                  Deceased
                </button>
              </div>
            </div>

            <div className="form-group biography-container">
              <label htmlFor="biography" className="biography-label">
                Biography:
              </label>
              <textarea
                name="biography"
                id="biography"
                className="biography-textarea"
                value={formData.biography}
                onChange={handleChange}
                rows="5"
                disabled={disableForm}
                aria-live="polite"
                aria-atomic="true"
              />
              <div className="char-count" id="biography-char-count">
                {formData.biography.length}
              </div>
            </div>
            <button type="submit" disabled={disableForm}>
              {isSubmitting ? (
                <>
                  <Spinner size="small" />
                  <span className="visually-hidden">
                    Submitting photocard...
                  </span>
                </>
              ) : isEditing ? (
                "Update Photocard"
              ) : (
                "Upload Photocard"
              )}
            </button>
          </form>
          <BackToTopButton />
        </>
      )}

      <DuplicateCheckModal
        isOpen={isDuplicateModalOpen}
        onClose={handleCloseDuplicateModal}
        existingPhotocards={potentialDuplicates}
        onConfirmContinue={handleConfirmDuplicateChoice}
        originalFormData={formData}
        onViewExistingPhotocard={handleViewExistingPhotocardInModal}
        age={formData.age}
        months={formData.months}
      />

      {isBioDisplayModalOpen && bioDisplayModalPhotoId && (
        <BioDisplayModal
          isOpen={isBioDisplayModalOpen}
          onClose={handleCloseBioDisplayModal}
          photocardId={bioDisplayModalPhotoId}
        />
      )}

      {isCropperModalOpen && (
        <ImageCropperModal
          image={imageToCrop}
          onDone={handleDoneCropping}
          onCancel={handleCancelCrop}
        />
      )}
    </div>
  );
};

export default UploadForm;
