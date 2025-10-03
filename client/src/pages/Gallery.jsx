// Gallery.jsx
// --- IMPORTS ---
// React & Router Hooks
import { useNavigate } from "react-router-dom";
import { useState, useCallback, useMemo } from "react";

// Context
import { useMessage } from "../context/MessageContext";
import { apiClient, useAuth } from "../context/AuthContext";

// Components
import BackToTopButton from "../components/BackToTopButton";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import Photocard from "../components/Photocard";

// Modals
import BioDisplayModal from "../modals/BioDisplayModal";
import ReportModal from "../modals/ReportModal";

// Utilities
import { applyFilters } from "../utils/photocardUtils";

// Styles
import "../styles/pages/Gallery.css";

const Gallery = ({
  photocards,
  refreshPhotocards,
  counts,
  loadingPhotocards,
  pagination,
  goToPage,
}) => {
  // --- HOOKS & STATE MANAGEMENT ---
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openMessage } = useMessage();

  const [selectedFilters, setSelectedFilters] = useState([]);
  const [showFlaggedDuplicates, setShowFlaggedDuplicates] = useState(true);
  const [unidentifiedFilter, setUnidentifiedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isBioDisplayModalOpen, setIsBioDisplayModalOpen] = useState(false);
  const [bioDisplayModalPhotoId, setBioDisplayModalPhotoId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [photocardToReport, setPhotocardToReport] = useState(null);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // --- EVENT HANDLERS ---
  const handleCardClick = useCallback(
    (id) => {
      navigate(`/bio/${id}`);
    },
    [navigate]
  );

  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
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
        showFlaggedDuplicates,
        unidentifiedFilter,
        searchQuery
      ),
    [
      photocards,
      selectedFilters,
      showFlaggedDuplicates,
      unidentifiedFilter,
      searchQuery,
    ]
  );

  const isSearching = searchQuery.length > 0;

  // --- RENDER ---
  return (
    <section className="gallery-page" aria-labelledby="gallery-title">
      <div className="title-img">
        <img src="/AidGaza1.png" alt="Palestine" className="title-img" />
      </div>

      <h2 id="gallery-subtitle" className="title-base subtitle">
        Gallery
      </h2>

      <div className="gallery-controls-container">
        <FilterBar
          selectedFilters={selectedFilters}
          setSelectedFilters={setSelectedFilters}
          showFlaggedDuplicates={showFlaggedDuplicates}
          setShowFlaggedDuplicates={setShowFlaggedDuplicates}
          unidentifiedFilter={unidentifiedFilter}
          setUnidentifiedFilter={setUnidentifiedFilter}
        />

        <div className="search-container">
          <label htmlFor="search-input" className="visually-hidden">
            Search photocards
          </label>
          <div className="search-input-wrapper">
            <input
              type="text"
              id="search-input"
              placeholder="Search by name or number"
              onChange={handleSearchChange}
              value={searchQuery}
              className="search-input"
              aria-label="Search photocards"
            />
            {isSearching && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                {" "}
                ×
              </button>
            )}
          </div>
          {isSearching && (
            <div className="search-info">
              <span>
                Found {filteredPhotocards.length} results for "{searchQuery}"{" "}
                {filteredPhotocards.length !== photocards.length &&
                  ` (filtered from ${photocards.length} total)`}
              </span>
              <button
                type="button"
                className="search-reset-btn"
                onClick={clearSearch}
              >
                Clear search
              </button>
            </div>
          )}
        </div>
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
            Injured:<span className="count-value">{counts.injured}</span>
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
        {loadingPhotocards ? (
          <p className="loading-message">Loading photocards...</p>
        ) : filteredPhotocards.length === 0 ? (
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

      {!isSearching && (
        <Pagination pagination={pagination} onPageChange={goToPage} />
      )}

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
