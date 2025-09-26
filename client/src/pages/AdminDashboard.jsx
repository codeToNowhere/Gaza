// AdminDashboard.jsx
// --- IMPORTS ---
// React & Router Hooks
import { useState, useEffect, useCallback, memo } from "react";
// Context
import { apiClient, useAuth } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
// Components
import AdminPhotocardItem from "../components/AdminPhotocardItem";
import AdminUserItem from "../components/AdminUserItem";
import BackToTopButton from "../components/BackToTopButton";
import Spinner from "../components/Spinner";
// Modals
import BioDisplayModal from "../modals/BioDisplayModal";
import DuplicateDisplayModal from "../modals/DuplicateDisplayModal";
import IdentificationReviewModal from "../modals/IdentificationReviewModal";
import ReportDisplayModal from "../modals/ReportDisplayModal";
// Utilities
import { getErrorMessage } from "../utils/getErrorMessage";
// Styles & Icons
import "../styles/pages/AdminDashboard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClone } from "@fortawesome/free-solid-svg-icons";

const AdminDashboard = memo(function AdminDashboard() {
  // --- CONTEXT & HOOKS ---
  const { user } = useAuth();
  const { openMessage, openConfirm } = useMessage();

  // --- STATE MANAGEMENT ---
  const [photocards, setPhotocards] = useState([]);
  const [deletedPhotocards, setDeletedPhotocards] = useState([]);
  const [users, setUsers] = useState([]);
  const [duplicatePhotocards, setDuplicatePhotocards] = useState([]);
  const [verifications, setVerifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("photocards");
  const [photocardFilter, setPhotocardFilter] = useState("flagged");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [error, setError] = useState(null);

  const [isBioDisplayModalOpen, setIsBioDisplayModalOpen] = useState(false);
  const [bioDisplayModalPhotoId, setBioDisplayModalPhotoId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportUserId, setSelectedReportUserId] = useState(null);
  const [selectedReportPhotocardId, setSelectedReportPhotocardId] =
    useState(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [duplicatePhotocardInfo, setDuplicatePhotocardInfo] = useState(null);
  const [isIdentificationReviewModalOpen, setIsIdentificationReviewModalOpen] =
    useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);

  const [photocardCounts, setPhotocardCounts] = useState({
    flagged: 0,
    blocked: 0,
    deleted: 0,
    duplicates: 0,
    unidentified: 0,
    total: 0,
  });
  const [userCounts, setUserCounts] = useState({
    flagged: 0,
    blocked: 0,
    total: 0,
  });

  // --- DATA FETCHING ---
  const fetchPhotocardCounts = useCallback(async () => {
    try {
      const response = await apiClient.get("/admin/photocards/counts");
      setPhotocardCounts(response.data.counts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load photocard counts."
      );
      setPhotocardCounts({
        flagged: 0,
        blocked: 0,
        deleted: 0,
        duplicates: 0,
        unidentified: 0,
        total: 0,
      });
    }
  }, [setError]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/users");
      const rawUsers = Array.isArray(response.data.users)
        ? response.data.users
        : [];
      const filteredUsers = rawUsers.filter((u) => u._id !== user.id);
      setUsers(filteredUsers);
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching users: ${getErrorMessage(err)}`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user, openMessage, setError]);

  const fetchPhotocards = useCallback(async () => {
    setLoading(true);
    let endpoint = "/admin/photocards";

    if (photocardFilter !== "all") {
      endpoint += `?status=${photocardFilter}`;
    }

    try {
      const response = await apiClient.get(endpoint);
      setPhotocards(
        Array.isArray(response.data.photocards) ? response.data.photocards : []
      );
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching ${photocardFilter} photocards: ${getErrorMessage(
        err
      )}`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setPhotocards([]);
    } finally {
      setLoading(false);
    }
  }, [photocardFilter, openMessage, setError]);

  const fetchDeletedPhotocards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/photocards/deleted");
      setDeletedPhotocards(
        Array.isArray(response.data.deletedPhotocards)
          ? response.data.deletedPhotocards
          : []
      );
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching deleted photocards: ${getErrorMessage(
        err
      )}`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setDeletedPhotocards([]);
    } finally {
      setLoading(false);
    }
  }, [openMessage, setError]);

  // Existing fetching functions
  const fetchUserCounts = useCallback(async () => {
    try {
      const response = await apiClient.get("/admin/users/counts");
      setUserCounts(response.data.counts);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load user counts."
      );
      setUserCounts({ flagged: 0, blocked: 0, total: 0 });
    }
  }, [setError]);

  const fetchDuplicatePhotocards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/photocards/duplicates");
      setDuplicatePhotocards(
        Array.isArray(response.data.photocards) ? response.data.photocards : []
      );
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching duplicate photocards: ${getErrorMessage(
        err
      )}`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setDuplicatePhotocards([]);
    } finally {
      setLoading(false);
    }
  }, [openMessage, setError]);

  const fetchVerifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/verifications/pending");
      setVerifications(
        Array.isArray(response.data.verifications)
          ? response.data.verifications
          : []
      );
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching verifications: ${getErrorMessage(
        err
      )}`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setVerifications([]);
    } finally {
      setLoading(false);
    }
  }, [openMessage, setError]);

  const fetchDashboardData = useCallback(() => {
    fetchPhotocardCounts();
    fetchUserCounts();

    if (activeTab === "photocards") {
      fetchPhotocards();
    } else if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "duplicates") {
      fetchDuplicatePhotocards();
    } else if (activeTab === "verifications") {
      fetchVerifications();
    } else if (activeTab === "deleted") {
      fetchDeletedPhotocards();
    }
  }, [
    activeTab,
    fetchPhotocards,
    fetchUsers,
    fetchDuplicatePhotocards,
    fetchVerifications,
    fetchPhotocardCounts,
    fetchUserCounts,
    fetchDeletedPhotocards,
  ]);

  // --- EFFECTS ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // --- HANDLERS ---
  const handleAction = useCallback(
    async (
      apiCall,
      successTitle,
      successMessage,
      errorMessagePrefix,
      refreshFunctions
    ) => {
      setIsProcessingAction(true);
      try {
        await apiCall();
        openMessage(successTitle, successMessage, "success");
        if (Array.isArray(refreshFunctions)) {
          refreshFunctions.forEach((func) => func());
        } else {
          fetchDashboardData();
        }
      } catch (err) {
        const errorMessage = `${errorMessagePrefix}: ${getErrorMessage(err)}`;
        openMessage("Error", errorMessage, "error");
        setError(errorMessage);
      } finally {
        setIsProcessingAction(false);
      }
    },
    [openMessage, setError, fetchDashboardData]
  );

  // --- Photocard Handlers ---
  const handleBlockPhotocard = useCallback(
    (photocardId) => {
      const isCurrentlyBlocked = photocards.find(
        (p) => p._id === photocardId
      )?.blocked;
      const actionType = isCurrentlyBlocked ? "UNBLOCK" : "BLOCK";
      openConfirm(
        `${actionType} Photocard`,
        `Are you sure you want to ${actionType.toLowerCase()} this photocard?`,
        async () => {
          await handleAction(
            async () => {
              if (isCurrentlyBlocked) {
                await apiClient.put(`/admin/photocards/${photocardId}/unblock`);
              } else {
                await apiClient.put(`/admin/photocards/${photocardId}/block`);
              }
            },
            "Success",
            `Photocard has been ${
              isCurrentlyBlocked ? "unblocked" : "blocked"
            }!`,
            "Failed to update photocard block status",
            [fetchPhotocardCounts, fetchPhotocards, fetchDuplicatePhotocards]
          );
        }
      );
    },
    [
      photocards,
      fetchPhotocards,
      fetchPhotocardCounts,
      fetchDuplicatePhotocards,
      openConfirm,
      handleAction,
    ]
  );

  const handleRestorePhotocard = useCallback(
    (photocardId) => {
      openConfirm(
        "Unflag Photocard",
        "Are you sure you want to unflag this photocard?",
        async () => {
          await handleAction(
            async () => {
              await apiClient.put(
                `/admin/photocards/${photocardId}/unflag`,
                {}
              );
            },
            "Success",
            "Photocard unflagged successfully!",
            "Failed to unflag photocard.",
            [fetchPhotocards, fetchPhotocardCounts, fetchDuplicatePhotocards]
          );
        }
      );
    },
    [
      fetchPhotocards,
      fetchPhotocardCounts,
      fetchDuplicatePhotocards,
      openConfirm,
      handleAction,
    ]
  );

  const handleRestoreFromDeleted = useCallback(
    (photocardId) => {
      openConfirm(
        "Restore Photocard",
        "Are you sure you want to RESTORE this photocard? It will be visible on the gallery again.",
        async () => {
          await handleAction(
            async () => {
              await apiClient.put(`/admin/photocards/${photocardId}/restore`);
            },
            "Success",
            "Photocard restored successfully!",
            "Failed to restore photocard.",
            [fetchPhotocardCounts, fetchDeletedPhotocards]
          );
        }
      );
    },
    [openConfirm, handleAction, fetchPhotocardCounts, fetchDeletedPhotocards]
  );

  const handleDeletePhotocard = useCallback(
    (photocardId) => {
      openConfirm(
        "Delete Photocard",
        "Are you sure you want to delete this photocard permanently? This cannot be undone!",
        async () => {
          handleAction(
            async () => {
              await apiClient.delete(`/admin/photocards/${photocardId}`);
            },
            "Success",
            "Photocard deleted successfully!",
            "Failed to delete photocard!",
            [
              fetchPhotocards,
              fetchPhotocardCounts,
              fetchDuplicatePhotocards,
              fetchDeletedPhotocards,
            ]
          );
        }
      );
    },
    [
      fetchPhotocards,
      fetchPhotocardCounts,
      fetchDeletedPhotocards,
      fetchDuplicatePhotocards,
      openConfirm,
      handleAction,
    ]
  );

  const handlePhotocardClick = useCallback((photocardId) => {
    setBioDisplayModalPhotoId(photocardId);
    setIsBioDisplayModalOpen(true);
  }, []);

  const handleCloseBioDisplayModal = useCallback(() => {
    setIsBioDisplayModalOpen(false);
    setBioDisplayModalPhotoId(null);
  }, []);

  const handleViewReports = useCallback(
    async (itemId, reportType) => {
      setLoading(true);
      setError(null);

      try {
        let reports;
        let response;

        // Consolidate API call for both types
        response = await apiClient.get(
          `/admin/reports/${itemId}?itemType=${reportType}`
        );
        reports = response.data.reports;

        if (reportType === "photocard") {
          const isDuplicateReport = reports.some(
            (report) => report.reasonType === "duplicate"
          );

          if (isDuplicateReport) {
            const duplicateReport = reports.find(
              (report) => report.reasonType === "duplicate"
            );
            const originalPhotocardId = duplicateReport.duplicateOf._id;

            const comparisonResponse = await apiClient.get(
              `/admin/photocards/compare-suspected/${itemId}/${originalPhotocardId}`
            );
            setDuplicatePhotocardInfo(comparisonResponse.data);
            setIsDuplicateModalOpen(true);
          } else {
            setSelectedReportUserId(null);
            setSelectedReportPhotocardId(itemId);
            setIsReportModalOpen(true);
          }
        } else if (reportType === "user") {
          setSelectedReportPhotocardId(null);
          setSelectedReportUserId(itemId);
          setIsReportModalOpen(true);
        } else {
          throw new Error("Invalid report type provided.");
        }

        setError(null);
      } catch (err) {
        const errorMessage = `Failed to fetch report info: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
        setError(errorMessage);
        setDuplicatePhotocardInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [
      openMessage,
      setError,
      setSelectedReportUserId,
      setSelectedReportPhotocardId,
      setIsReportModalOpen,
      setDuplicatePhotocardInfo,
      setIsDuplicateModalOpen,
    ]
  );

  const handleConfirmAsDuplicate = useCallback(
    async (duplicateId, originalId) => {
      setIsProcessingAction(true);
      try {
        await apiClient.put("/admin/photocards/confirm-duplicate", {
          duplicatePhotocardId: duplicateId,
          originalPhotocardId: originalId,
        });

        openMessage(
          "Success",
          "Photocard confirmed as a duplicate.",
          "success"
        );
        setIsDuplicateModalOpen(false);
        fetchDashboardData();
      } catch (err) {
        const errorMessage = `Failed to confirm duplicate: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
      } finally {
        setIsProcessingAction(false);
      }
    },
    [openMessage, fetchDashboardData]
  );

  const handleCloseReportModal = useCallback(() => {
    setIsReportModalOpen(false);
    setSelectedReportPhotocardId(null);
    setSelectedReportUserId(null);
  }, []);

  const handleViewDuplicates = useCallback(
    async (duplicateId) => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/admin/photocards/compare/${duplicateId}`
        );
        setDuplicatePhotocardInfo(response.data);
        setIsDuplicateModalOpen(true);
        setError(null);
      } catch (err) {
        const errorMessage = `Failed to fetch duplicate photocard info: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
        setError(errorMessage);
        setDuplicatePhotocardInfo(null);
      } finally {
        setLoading(false);
      }
    },
    [openMessage, setError]
  );

  const handleCloseDuplicateModal = useCallback(() => {
    setIsDuplicateModalOpen(false);
    setDuplicatePhotocardInfo(null);
  }, []);

  const handleNotDuplicate = useCallback(
    async (photocardId) => {
      openConfirm(
        "Not a Duplicate",
        "Are you sure you want to mark this photocard as NOT a duplicate?",
        async () => {
          await handleAction(
            async () => {
              await apiClient.put(
                `/admin/photocards/${photocardId}/unflag-duplicate`
              );
            },
            "Success",
            "Photocard unmarked as duplicate!",
            "Failed to unmark photocard as duplicate.",
            [fetchPhotocardCounts, fetchDuplicatePhotocards]
          );
          handleCloseDuplicateModal();
        }
      );
    },
    [
      openConfirm,
      handleAction,
      fetchPhotocardCounts,
      fetchDuplicatePhotocards,
      handleCloseDuplicateModal,
    ]
  );

  const handleReviewIdentification = useCallback(
    async (verificationId) => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/admin/verifications/${verificationId}`
        );
        const verification = response.data.verification;

        setSelectedVerification({
          verification: verification,
          originalPhotocard: verification.originalPhotocard,
          provisionalPhotocard: verification.provisionalPhotocard,
        });
        setIsIdentificationReviewModalOpen(true);
        setError(null);
      } catch (err) {
        console.error("Error in handleReviewIdentification:", err);
        const errorMessage = `Failed to fetch verification details: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [openMessage, setError]
  );

  const handleCloseIdentificationModal = useCallback(() => {
    setIsIdentificationReviewModalOpen(false);
    setSelectedVerification(null);
  }, []);

  const handleApproveIdentification = useCallback(
    async (verificationId) => {
      setIsProcessingAction(true);

      try {
        await apiClient.patch(`/admin/verifications/${verificationId}/approve`);
        openMessage(
          "Success",
          "Identification approved successfully!",
          "success"
        );
        setIsIdentificationReviewModalOpen(false);
        fetchDashboardData();
      } catch (err) {
        const errorMessage = `Failed to approve identification: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
      } finally {
        setIsProcessingAction(false);
      }
    },
    [openMessage, fetchDashboardData]
  );

  const handleRejectIdentification = useCallback(
    async (verificationId, comments = "") => {
      setIsProcessingAction(true);

      try {
        const data = comments ? { comments } : {};

        await apiClient.patch(
          `/admin/verifications/${verificationId}/reject`,
          data
        );
        openMessage("Success", "Identification rejected.", "success");
        setIsIdentificationReviewModalOpen(false);
        fetchDashboardData();
      } catch (err) {
        const errorMessage = `Failed to reject identification: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
      } finally {
        setIsProcessingAction(false);
      }
    },
    [openMessage, fetchDashboardData]
  );

  // --- User Handlers ---
  const handleBlockUser = useCallback(
    (userId, username) => {
      openConfirm(
        "Block User",
        `Are you sure you want to BLOCK user "${username}"? They will no longer be able to log in.`,
        async () => {
          await handleAction(
            async () => {
              await apiClient.put(`/admin/users/${userId}/block`, {});
            },
            "Success",
            `User "${username}" has been blocked.`,
            "Failed to block user.",
            [fetchUserCounts, fetchUsers]
          );
        }
      );
    },
    [fetchUsers, fetchUserCounts, openConfirm, handleAction]
  );

  const handleUnblockUser = useCallback(
    (userId, username) => {
      openConfirm(
        "Unblock User",
        `Are you sure you want to UNBLOCK user "${username}"? They will regain access.`,
        async () => {
          await handleAction(
            async () => {
              await apiClient.put(`/admin/users/${userId}/unblock`, {});
            },
            "Success",
            `User "${username}" has been unblocked.`,
            `Failed to unblock user ${username}`,
            [fetchUserCounts, fetchUsers]
          );
        }
      );
    },
    [fetchUsers, fetchUserCounts, openConfirm, handleAction]
  );

  const handleDeleteUser = useCallback(
    (userId, username) => {
      openConfirm(
        "Delete User",
        `WARNING: Are you sure you want to PERMANENTLY DELETE user "${username}"? This will also delete ALL of their uploaded photocards and cannot be undone.`,
        async () => {
          await handleAction(
            async () => {
              await apiClient.delete(`/admin/users/${userId}`);
            },
            "Success",
            `User "${username}" and all their associated photocards have been deleted.`,
            `Failed to delete user ${username}`,
            [fetchUsers, fetchUserCounts]
          );
        }
      );
    },
    [fetchUsers, fetchUserCounts, openConfirm, handleAction]
  );

  // --- RENDER ---
  const showPageSpinner =
    loading &&
    !isBioDisplayModalOpen &&
    !isReportModalOpen &&
    !isDuplicateModalOpen;

  if (showPageSpinner) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  if (error && !isBioDisplayModalOpen && !isReportModalOpen) {
    return <div className="admin-dashboard error">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="admin-counts-summary">
        <div className="count-card">
          <h3>Photocards</h3>
          <p>
            Total: <strong>{photocardCounts.total}</strong>
          </p>
          <p>
            Flagged: <strong>{photocardCounts.flagged}</strong>
          </p>
          <p>
            Blocked: <strong>{photocardCounts.blocked}</strong>
          </p>
          <p>
            Deleted: <strong>{photocardCounts.deleted}</strong>
          </p>
          <p>
            Duplicates: <strong>{photocardCounts.duplicates}</strong>
          </p>
          <p>
            Unidentified: <strong>{photocardCounts.unidentified}</strong>
          </p>
        </div>
        <div className="count-card">
          <h3>Users</h3>
          <p>
            Total: <strong>{userCounts.total}</strong>
          </p>
          <p>
            Flagged: <strong>{userCounts.flagged}</strong>
          </p>
          <p>
            Blocked: <strong>{userCounts.blocked}</strong>
          </p>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === "photocards"}`}
          onClick={() => setActiveTab("photocards")}
          disabled={isProcessingAction}
        >
          Manage Photocards
        </button>
        <button
          className={`tab-button ${activeTab === "duplicates"}`}
          onClick={() => setActiveTab("duplicates")}
          disabled={isProcessingAction}
        >
          <FontAwesomeIcon icon={faClone} /> Identical Photocards
        </button>
        <button
          className={`tab-button ${activeTab === "verifications"}`}
          onClick={() => setActiveTab("verifications")}
          disabled={isProcessingAction}
        >
          Verifications
        </button>
        <button
          className={`tab-button ${activeTab === "deleted" ? "active" : ""}`}
          onClick={() => setActiveTab("deleted")}
          disabled={isProcessingAction}
        >
          <FontAwesomeIcon icon="trash" /> Deleted Photocards
        </button>
        <button
          className={`tab-button ${activeTab === "users"}`}
          onClick={() => setActiveTab("users")}
          disabled={isProcessingAction}
        >
          Manage Users
        </button>
      </div>

      {activeTab === "photocards" && (
        <div className="admin-section photocard-section">
          <h2>Photocard Management</h2>
          <div className="filter-controls">
            <label className="filter-label">
              <input
                type="radio"
                name="photocardFilter"
                value="flagged"
                checked={photocardFilter === "flagged"}
                onChange={() => setPhotocardFilter("flagged")}
                disabled={isProcessingAction}
              />{" "}
              <span>Flagged</span>
            </label>
            <label className="filter-label">
              <input
                type="radio"
                name="photocardFilter"
                value="blocked"
                checked={photocardFilter === "blocked"}
                onChange={() => setPhotocardFilter("blocked")}
                disabled={isProcessingAction}
              />{" "}
              <span>Blocked</span>
            </label>
            <label className="filter-label">
              <input
                type="radio"
                name="photocardFilter"
                value="both"
                checked={photocardFilter === "both"}
                onChange={() => setPhotocardFilter("both")}
                disabled={isProcessingAction}
              />{" "}
              <span>Both</span>
            </label>
          </div>
          <div className="photocard-list">
            {photocards?.length > 0 ? (
              photocards.map((photocard) => (
                <AdminPhotocardItem
                  key={photocard._id}
                  photocard={photocard}
                  user={user}
                  onPhotocardClick={handlePhotocardClick}
                  onBlock={handleBlockPhotocard}
                  onRestore={handleRestorePhotocard}
                  onDelete={handleDeletePhotocard}
                  onViewReport={handleViewReports}
                  onViewDuplicates={handleViewDuplicates}
                  isProcessingAction={isProcessingAction}
                />
              ))
            ) : (
              <p>No photocards match the current filter.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "duplicates" && (
        <div className="admin-section duplicates-section">
          <h2>Identical Photocards</h2>
          <p>
            These photocards are either flagged as potential duplicates by users
            or identified as such based on shared names and details.
          </p>
          <div className="photocard-list">
            {duplicatePhotocards?.length > 0 ? (
              duplicatePhotocards.map((photocard) => (
                <AdminPhotocardItem
                  key={photocard._id}
                  photocard={{ ...photocard, isDuplicate: true }}
                  user={user}
                  onPhotocardClick={handlePhotocardClick}
                  onBlock={handleBlockPhotocard}
                  onRestore={handleRestorePhotocard}
                  onDelete={handleDeletePhotocard}
                  onViewReport={handleViewReports}
                  onViewDuplicates={handleViewDuplicates}
                  isProcessingAction={isProcessingAction}
                />
              ))
            ) : (
              <p>No photocards confirmed as duplicates found.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "verifications" && (
        <div className="admin-section verifications-section">
          <h2>Pending Identifications</h2>{" "}
          {verifications.length === 0 ? (
            <p>No pending identification requests.</p>
          ) : (
            <div className="verifications-list">
              {verifications.map((verification) => (
                <div key={verification._id} className="verification-item">
                  <div className="verification-info">
                    <h4>Identification Request</h4>
                    <p>
                      <strong>Submitted by:</strong>{" "}
                      {verification.submittedBy?.username}
                    </p>
                    <p>
                      <strong>Proposed Name:</strong>{" "}
                      {verification.proposedData?.name}
                    </p>
                    <p>
                      <strong>Submitted:</strong>{" "}
                      {new Date(verification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="verification-actions">
                    <button
                      className="review-button"
                      onClick={() =>
                        handleReviewIdentification(verification._id)
                      }
                      disabled={isProcessingAction}
                    >
                      Review Identification
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "deleted" && (
        <div className="admin-section deleted-section">
          <h2>Soft-Deleted Photocards</h2>
          <p>
            These photocards have been soft-deleted and are not visible in the
            main gallery. You can restore them or delete them permanently.
          </p>
          <div className="photocard-list">
            {deletedPhotocards?.length > 0 ? (
              deletedPhotocards.map((photocard) => (
                <AdminPhotocardItem
                  key={photocard._id}
                  photocard={photocard}
                  user={user}
                  onPhotocardClick={handlePhotocardClick}
                  onRestore={handleRestoreFromDeleted}
                  onDelete={handleDeletePhotocard}
                  isProcessingAction={isProcessingAction}
                  isDeleted={true}
                />
              ))
            ) : (
              <p>No soft-deleted photocards found.</p>
            )}
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="admin-section users-section">
          <h2>User Management</h2>
          <div className="user-list">
            {users?.length > 0 ? (
              users.map((u) => (
                <AdminUserItem
                  key={u._id}
                  user={u}
                  currentUser={user}
                  onBlock={handleBlockUser}
                  onUnblock={handleUnblockUser}
                  onDelete={handleDeleteUser}
                  onViewReport={handleViewReports}
                  isProcessingAction={isProcessingAction}
                />
              ))
            ) : (
              <p>No users found or available for management.</p>
            )}
          </div>
        </div>
      )}

      {isProcessingAction && <Spinner />}

      <BackToTopButton />

      <BioDisplayModal
        isOpen={isBioDisplayModalOpen}
        onClose={handleCloseBioDisplayModal}
        photocardId={bioDisplayModalPhotoId}
        isAdmin={true}
      />

      <ReportDisplayModal
        isOpen={isReportModalOpen}
        onClose={handleCloseReportModal}
        photocardId={selectedReportPhotocardId}
        userId={selectedReportUserId}
      />

      <DuplicateDisplayModal
        isOpen={isDuplicateModalOpen}
        onClose={handleCloseDuplicateModal}
        duplicatePhotocardInfo={duplicatePhotocardInfo}
        onBlock={handleBlockPhotocard}
        onRestore={handleRestorePhotocard}
        onDelete={handleDeletePhotocard}
        isProcessingAction={isProcessingAction}
        onConfirmDuplicate={handleConfirmAsDuplicate}
        onPhotocardClick={handlePhotocardClick}
        onNotDuplicate={handleNotDuplicate}
      />

      <IdentificationReviewModal
        isOpen={isIdentificationReviewModalOpen}
        onClose={handleCloseIdentificationModal}
        verificationInfo={selectedVerification}
        onApprove={handleApproveIdentification}
        onReject={handleRejectIdentification}
        isProcessingAction={isProcessingAction}
        onPhotocardClick={handlePhotocardClick}
      />
    </div>
  );
});

export default AdminDashboard;
