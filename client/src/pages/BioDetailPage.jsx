// BioDetailPage.jsx
// --- IMPORTS ---
// React & Router Hooks
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
//Context
import { apiClient, useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
// Components
import BackToTopButton from "../components/BackToTopButton";
import Spinner from "../components/Spinner";
// Modals
import BioDisplayModal from "../modals/BioDisplayModal";
import IdentifyPersonModal from "../modals/IdentifyPersonModal";
import ReportModal from "../modals/ReportModal";
// Utilities
import { formatAgeDisplay } from "../utils/formDataUtils";
import { getErrorMessage } from "../utils/getErrorMessage";
import {
  applyFilters,
  getStatusLabel,
  getBorderClass,
  getPhotocardImageSrc,
} from "../utils/photocardUtils";
// Styles & Icons
import "../styles/pages/BioDetailPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const BioDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { openMessage, closeMessage } = useMessage();

  // --- STATE MANAGEMENT ---
  const [photocard, setPhotocard] = useState(null);
  const [duplicatePhotocard, setDuplicatePhotocard] = useState(null);
  const [photocardIds, setPhotocardIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBioDisplayModalOpen, setIsBioDisplayModalOpen] = useState(false);
  const [bioDisplayModalPhotoId, setBioDisplayModalPhotoId] = useState(null);
  const [isIdentifyPersonModalOpen, setIsIdentifyPersonModalOpen] =
    useState(false);

  // --- UTILITY & FETCH FUNCTIONS ---
  const openBioDisplayModal = useCallback((photocardIdToDisplay) => {
    setBioDisplayModalPhotoId(photocardIdToDisplay);
    setIsBioDisplayModalOpen(true);
  }, []);

  const closeBioDisplayModal = useCallback(() => {
    setIsBioDisplayModalOpen(false);
    setBioDisplayModalPhotoId(null);
  }, []);

  const fetchSinglePhotocardById = useCallback(async (photocardId) => {
    try {
      const response = await apiClient.get(`/photocards/${photocardId}`);

      if (response.data.success) {
        return response.data.photocard;
      }

      return null;
    } catch (err) {
      if (err.response?.status === 403) {
        throw new Error("blocked");
      }
      return null;
    }
  }, []);

  // --- EFFECTS ---
  useEffect(() => {
    const fetchAndSetPhotocard = async () => {
      setLoading(true);
      setError(null);
      setDuplicatePhotocard(null);
      closeMessage();

      try {
        const photocardData = await fetchSinglePhotocardById(id);

        if (!photocardData) {
          throw new Error("Photocard not found.");
        }

        if (photocardData.blocked) {
          setError("blocked");
          openMessage(
            "Access Denied",
            "This photocard is currently blocked.",
            "error",
            () => navigate("/"),
            [{ text: "Go to Gallery", onClick: () => navigate("/") }]
          );
          return;
        }

        setPhotocard(photocardData);

        if (
          photocardData.flaggedReasonType === "duplicate" &&
          photocardData.flaggedDuplicateOf
        ) {
          const duplicateData = await fetchSinglePhotocardById(
            photocardData.flaggedDuplicateOf
          );

          setDuplicatePhotocard(duplicateData);
        }
      } catch (err) {
        const errorMessage = getErrorMessage(
          err,
          "Failed to fetch photocard details."
        );

        setError(errorMessage);

        openMessage("Error", errorMessage, "error", () => closeMessage(), [
          { text: "OK", onClick: closeMessage },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const { photocardsList, initialIndex } = location.state || {};

    if (photocardsList && initialIndex !== undefined) {
      setPhotocardIds(photocardsList);
      setCurrentIndex(initialIndex);
    } else {
      const fetchAllForFallback = async () => {
        try {
          const allPhotocardsResponse = await apiClient.get("/photocards");
          const allFetchedPhotocards = allPhotocardsResponse.data.photocards;
          const filtered = applyFilters(allFetchedPhotocards, [], "", true);
          const ids = filtered.map((p) => p._id);

          const currentIdx = ids.findIndex((pid) => pid === id);

          setPhotocardIds(ids);
          setCurrentIndex(currentIdx);
        } catch (err) {
          console.error("Failed to fetch all photocards for fallback.", err);
        }
      };
      fetchAllForFallback();
    }
    fetchAndSetPhotocard();
  }, [
    id,
    location.state,
    navigate,
    openMessage,
    closeMessage,
    fetchSinglePhotocardById,
  ]);

  // --- NAVIGATION HANDLERS ---
  const goToPhotocard = useCallback(
    (newIndex) => {
      if (
        photocardIds.length > 0 &&
        newIndex >= 0 &&
        newIndex < photocardIds.length
      ) {
        navigate(`/bio/${photocardIds[newIndex]}`, {
          state: {
            ...location.state,
            photocardsList: photocardIds,
            initialIndex: newIndex,
          },
        });
      } else {
        navigate("/");
      }
    },
    [navigate, photocardIds, location.state]
  );

  const goHome = () => navigate("/");

  const goToPrevious = () => {
    if (currentIndex !== null) {
      goToPhotocard(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex !== null) {
      goToPhotocard(currentIndex + 1);
    }
  };

  // --- HANDLERS ---
  const handleReportButtonClick = () => {
    if (!user) {
      openMessage(
        "Report Error",
        "You must be logged in to report content",
        "error",
        closeMessage,
        [{ text: "OK", onClick: closeMessage }]
      );

      return;
    }

    const isOwner = user.id === photocard.createdBy?._id;

    if (isOwner) {
      openMessage(
        "Report Error",
        "You cannot report your own photocard or account.",
        "error",
        closeMessage,
        [{ text: "OK", onClick: closeMessage }]
      );

      return;
    }

    setIsReportModalOpen(true);
  };

  const handleReportSubmit = useCallback(
    async (reportType, reason, reasonType, duplicateOfId) => {
      setIsSubmittingReport(true);
      setIsReportModalOpen(false);

      try {
        const payload = {
          itemId:
            reportType === "photocard"
              ? photocard._id
              : photocard.createdBy._id,
          reportType: reportType,
          reason: reason,
          reasonType: reasonType,
          duplicateOfId: duplicateOfId,
        };

        const response = await apiClient.post("/reports", payload);

        if (response.data.success) {
          openMessage(
            "Success",
            response.data.message,
            "success",
            closeMessage,
            [{ text: "OK", onClick: closeMessage }]
          );

          if (reportType === "photocard") {
            setPhotocard((prevPhotocard) => ({ ...prevPhotocard }));
          }
        } else {
          throw new Error(response.data.message || "Failed to submit report.");
        }
      } catch (err) {
        openMessage(
          "Report Error",
          `Failed to report ${reportType}. Please try again. ${
            err.response?.data?.message || ""
          }`,
          "error",
          closeMessage,
          [{ text: "OK", onClick: closeMessage }]
        );
      } finally {
        setIsSubmittingReport(false);
      }
    },
    [photocard, openMessage, closeMessage]
  );

  const handleIdentifyClick = () => {
    setIsIdentifyPersonModalOpen(true);
  };

  const handleCloseIdentificationModal = useCallback(() => {
    setIsIdentifyPersonModalOpen(false);
  }, []);

  const handleIdentificationSuccess = useCallback(
    async (identificationData) => {
      try {
        // Option 1: If your API returns the updated photocard
        if (identificationData?.updatedPhotocard) {
          setPhotocard(identificationData.updatedPhotocard);
        }
        // Option 2: If not, refetch the current photocard
        else {
          const updatedPhotocard = await fetchSinglePhotocardById(id);
          if (updatedPhotocard) {
            setPhotocard(updatedPhotocard);
          }
        }

        // Show success message
        openMessage(
          "Identification Submitted",
          "Thank you! Your identification has been submitted for review.",
          "success",
          closeMessage,
          [{ text: "OK", onClick: closeMessage }]
        );

        // Close the modal
        setIsIdentifyPersonModalOpen(false);
      } catch (err) {
        // Fallback: still update optimistically and show message
        setPhotocard((prev) => ({
          ...prev,
          isUnidentified: false,
        }));

        openMessage(
          "Identification Submitted",
          "Thank you! Your identification has been submitted for review.",
          "success",
          closeMessage,
          [{ text: "OK", onClick: closeMessage }]
        );
      }
    },
    [id, fetchSinglePhotocardById, openMessage, closeMessage]
  );

  // --- PRE-RENDER LOGIC ---
  if (loading) {
    return <Spinner />;
  }

  if (error && error !== "blocked") {
    return <p className="error-message">Error: {error}</p>;
  }

  if (!photocard) return null;

  const status = getStatusLabel(photocard);
  const borderClass = getBorderClass(status);
  const imageSrc = getPhotocardImageSrc(photocard);

  const hasInlineStatusMessage =
    photocard.blocked || photocard.flagged || photocard.isConfirmedDuplicate;

  // --- RENDER ---
  return (
    <div className="bio-detail-container">
      <img
        src={imageSrc}
        alt={photocard.name ? `${photocard.name}'s portrait` : "Placeholder"}
        className={`bio-photocard ${borderClass}`}
      />
      <div className="bio-buttons-top">
        <button
          className="circle-button"
          onClick={goToPrevious}
          aria-label="Go to previous filtered photocard"
          disabled={isSubmittingReport || currentIndex <= 0}
        >
          <FontAwesomeIcon icon="arrow-left" />
        </button>

        <button
          className="circle-button"
          onClick={goHome}
          aria-label="Go to gallery"
          disabled={isSubmittingReport}
        >
          <FontAwesomeIcon icon="house" />
        </button>

        <button
          className="circle-button"
          onClick={goToNext}
          aria-label="Go to next filtered photocard"
          disabled={
            isSubmittingReport || currentIndex >= photocardIds.length - 1
          }
        >
          <FontAwesomeIcon icon="arrow-right" />
        </button>
      </div>

      <div className="bio-info">
        <h2>{photocard.name}</h2>

        {photocard.isUnidentified && user && !user.isBlocked && (
          <button
            className="identify-button"
            onClick={handleIdentifyClick}
            title="I know this person"
          >
            Identify
          </button>
        )}

        {user &&
          photocard.createdBy &&
          photocard.createdBy._id !== user.id &&
          !photocard.flagged && (
            <button
              className="report-button"
              onClick={handleReportButtonClick}
              title="Report this photocard or its uploader"
              disabled={isSubmittingReport}
            >
              {isSubmittingReport ? (
                <>
                  Reporting... <span className="spinner-inline"></span>
                </>
              ) : (
                <>
                  <span className="report-icon">
                    <FontAwesomeIcon icon="flag" />
                  </span>
                </>
              )}
            </button>
          )}

        {hasInlineStatusMessage && (
          <div className="status-messages-container">
            {photocard.blocked && (
              <p className="blocked-indicator">
                <FontAwesomeIcon icon="flag" /> This photocard is currently
                blocked by an administrator.
              </p>
            )}

            {photocard.flagged &&
            photocard.flaggedReasonType === "duplicate" ? (
              <p className="duplicate-indicator">
                <FontAwesomeIcon icon="flag" />
                This photocard has been flagged as a potential duplicate by a
                user.{" "}
                {photocard.flaggedDuplicateOf && (
                  <>
                    {" "}
                    (Duplicate of:{" "}
                    <button
                      onClick={() =>
                        openBioDisplayModal(photocard.flaggedDuplicateOf)
                      }
                      className="inline-link-button"
                      title={`View photocard: ${
                        duplicatePhotocard?.name || photocard.flaggedDuplicateOf
                      }`}
                    >
                      {duplicatePhotocard?.name ||
                        photocard.flaggedDuplicateOf.substring(0, 8) + "..."}
                    </button>
                    )
                  </>
                )}
              </p>
            ) : (
              photocard.flagged && (
                <p className="reported-indicator">
                  <FontAwesomeIcon icon="flag" />
                  This photocard has been reported for review.
                </p>
              )
            )}
            {photocard.isConfirmedDuplicate && (
              <p className="duplicate-indicator">
                Note: There may be other photocards with this name. This was
                confirmed by the uploader as a separate entry for the same
                person.
              </p>
            )}
          </div>
        )}
        {photocard.createdBy && photocard.createdBy.username && (
          <p className="uploaded-by">
            Uploaded by: <strong>{photocard.createdBy.username}</strong>{" "}
            {photocard.createdBy.isBlocked && (
              <span className="blocked-user-tag"> (Blocked Account)</span>
            )}
          </p>
        )}
        <p>
          <strong>Condition: </strong> {photocard.condition || "Not specified"}
        </p>
        <p>
          <strong>Age: </strong>
          {formatAgeDisplay(photocard.age, photocard.months)}
        </p>
        <p>
          <strong>Bio:</strong>
        </p>
        <p className="bio-text">
          {" "}
          {photocard.biography || "No biography provided"}
        </p>
      </div>
      <BackToTopButton />
      {isReportModalOpen && photocard && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportSubmit}
          photocard={photocard}
          isSubmitting={isSubmittingReport}
          onViewExistingPhotocard={openBioDisplayModal}
        />
      )}
      <BioDisplayModal
        isOpen={isBioDisplayModalOpen}
        onClose={closeBioDisplayModal}
        photocardId={bioDisplayModalPhotoId}
      />
      <IdentifyPersonModal
        photocard={photocard}
        isOpen={isIdentifyPersonModalOpen}
        onClose={handleCloseIdentificationModal}
        onSuccess={handleIdentificationSuccess}
      />
    </div>
  );
};

export default BioDetailPage;
