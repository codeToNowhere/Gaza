// Gallery.jsx
// --- IMPORTS ---
// React & Router Hooks
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo } from "react";
//Context
import { useMessage } from "../context/MessageContext";
import { apiClient, useAuth } from "../context/AuthContext";
// Components
import BackToTopButton from "../components/BackToTopButton";
import FilterBar from "../components/FilterBar";
import Photocard from "../components/Photocard";
// Modals
import BioDisplayModal from "../modals/BioDisplayModal";
import ReportModal from "../modals/ReportModal";
// Utilities
import { applyFilters } from "../utils/photocardUtils";
// Styles
import "../styles/pages/Gallery.css";

const Gallery = ({ photocards, refreshPhotocards, counts }) => {
  // --- HOOKS & STATE MANAGEMENT ---

  const navigate = useNavigate();
  const { user } = useAuth();
  const { openMessage } = useMessage();

  const [selectedFilters, setSelectedFilters] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFlaggedDuplicates, setShowFlaggedDuplicates] = useState(true);
  const [excludeUnidentified, setExcludeUnidentified] = useState(false);

  const [isBioDisplayModalOpen, setIsBioDisplayModalOpen] = useState(false);
  const [bioDisplayModalPhotoId, setBioDisplayModalPhotoId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [photocardToReport, setPhotocardToReport] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // --- EVENT HANDLERS ---
  const handleCardClick = useCallback(
    (id) => {
      navigate(`/bio/${id}`, {
        state: {
          filters: selectedFilters,
          search: searchQuery,
          showFlaggedDuplicates: showFlaggedDuplicates,
        },
      });
    },
    [navigate, selectedFilters, searchQuery, showFlaggedDuplicates]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleOpenReportModal = useCallback((photocard) => {
    setPhotocardToReport(photocard);
    setIsReportModalOpen(true);
  }, []);

  const handleViewExistingPhotocard = useCallback((photocardId) => {
    setIsBioDisplayModalOpen(true);
    setBioDisplayModalPhotoId(photocardId);
  }, []);

  const handleReportSubmit = useCallback(
    async (
      photocardIdFromModal,
      reportType,
      reason,
      reasonType,
      duplicateOfId
    ) => {
      setIsSubmittingReport(true);
      setIsReportModalOpen(false);

      try {
        if (reportType === "photocard") {
          const payload = { flagged: true, reason, reasonType };
          if (reasonType === "duplicate" && duplicateOfId) {
            payload.duplicateOf = duplicateOfId;
          } else if (reasonType === "duplicate" && duplicateOfId === null) {
            payload.duplicateOf = "unspecified";
          }

          await apiClient.patch(
            `/photocards/${photocardIdFromModal}/flag`,
            payload
          );
          openMessage(
            "Success",
            "Photocard reported successfully for review.",
            "success"
          );

          refreshPhotocards();
        } else if (reportType === "user") {
          if (
            !photocardToReport ||
            !photocardToReport.createdBy ||
            !photocardToReport.createdBy._id
          ) {
            openMessage(
              "Report Error",
              "Uploader information not available for reporting.",
              "error"
            );
            return;
          }
          const userIdToReport = photocardToReport.createdBy._id;
          await apiClient.patch(`/auth/flag-user/${userIdToReport}`, {
            reason,
          });
          openMessage(
            "Success",
            `User "${photocardToReport.createdBy.username}" successfully reported for review.`,
            "success"
          );
        }
      } catch (err) {
        console.error("Gallery: Error reporting:", err);
        openMessage(
          "Report Error",
          err.response?.data?.message ||
            `Failed to report ${reportType}. Please try again.`,
          "error"
        );
      } finally {
        setIsSubmittingReport(false);
        setPhotocardToReport(null);
      }
    },
    [openMessage, photocardToReport, refreshPhotocards]
  );

  // --- DERIVED STATE & FILTERING ---
  const filteredPhotocards = useMemo(
    () =>
      applyFilters(
        photocards,
        selectedFilters,
        searchQuery,
        showFlaggedDuplicates,
        excludeUnidentified
      ),
    [
      photocards,
      selectedFilters,
      searchQuery,
      showFlaggedDuplicates,
      excludeUnidentified,
    ]
  );

  // --- RENDER ---
  return (
    <section className="gallery-page" aria-labelledby="gallery-title">
      <h1 id="gallery-title" className="title-base title">
        AID GAZA
      </h1>
      <h2 id="gallery-subtitle" className="title-base subtitle">
        Gallery
      </h2>

      <div className="gallery-controls-container">
        <FilterBar
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          showFlaggedDuplicates={showFlaggedDuplicates}
          setShowFlaggedDuplicates={setShowFlaggedDuplicates}
          excludeUnidentified={excludeUnidentified}
          setExcludeUnidentified={setExcludeUnidentified}
        />
        <label htmlFor="search-input" className="visually-hidden">
          Search photocards
        </label>
        <input
          type="text"
          id="search-input"
          placeholder="Search"
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Search photocards"
        />
        <div
          className="photocard-counts"
          role="status"
          aria-live="polite"
          aria-label="Photocard counts by condition"
        >
          <p>
            Missing:<span className="count-value">{counts.missing}</span>
          </p>
          <p>
            Detained:<span className="count-value">{counts.detained}</span>
          </p>
          <p>
            Deceased:<span className="count-value">{counts.deceased}</span>
          </p>
          <p>
            Total:<span className="count-value">{counts.total}</span>
          </p>
        </div>
      </div>
      <div className="gallery-container" role="grid">
        {filteredPhotocards.length === 0 ? (
          <p className="no-results" role="status" aria-live="polite">
            No photocards match your search or filters. Please adjust your
            criteria.
          </p>
        ) : (
          filteredPhotocards.map((photocard) => (
            <Photocard
              key={photocard._id}
              photocard={photocard}
              onClick={() => handleCardClick(photocard._id)}
              onOpenReportModal={handleOpenReportModal}
              disabled={isSubmittingReport}
            />
          ))
        )}
      </div>

      <BackToTopButton />

      {isReportModalOpen && photocardToReport && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={handleReportSubmit}
          photocard={photocardToReport}
          isSubmitting={isSubmittingReport}
          onViewExistingPhotocard={handleViewExistingPhotocard}
        />
      )}

      {isBioDisplayModalOpen && bioDisplayModalPhotoId && (
        <BioDisplayModal
          isOpen={isBioDisplayModalOpen}
          onClose={() => {
            setIsBioDisplayModalOpen(false);
            setBioDisplayModalPhotoId(null);
          }}
          photocardId={bioDisplayModalPhotoId}
        />
      )}
    </section>
  );
};

export default Gallery;
