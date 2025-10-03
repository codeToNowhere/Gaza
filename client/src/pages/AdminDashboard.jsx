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
  const [allPhotocards, setAllPhotocards] = useState({
    flagged: [],
    blocked: [],
    deleted: [],
    duplicates: [],
  });
  const [users, setUsers] = useState([]);
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
  const [selectedDeletionReport, setSelectedDeletionReport] = useState(null);
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
      const errorMessage = `Failed to load photocard counts: ${getErrorMessage(
        err
      )}`;
      setError(errorMessage);
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

  const fetchUserCounts = useCallback(async () => {
    try {
      const response = await apiClient.get("/admin/users/counts");
      setUserCounts(response.data.counts);
    } catch (err) {
      const errorMessage = `Failed to load user counts: ${getErrorMessage(
        err
      )}`;
      setError(getErrorMessage(err));
      setUserCounts({ flagged: 0, blocked: 0, total: 0 });
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

  const fetchAllPhotocards = useCallback(async () => {
    setLoading(true);
    try {
      const [flagged, blocked, deleted, duplicates] = await Promise.all([
        apiClient.get("/admin/photocards?status=flagged"),
        apiClient.get("/admin/photocards?status=blocked"),
        apiClient.get("/admin/photocards?status=deleted"),
        apiClient.get("/admin/photocards/duplicates"),
      ]);
      setAllPhotocards({
        flagged: flagged.data.photocards,
        blocked: blocked.data.photocards,
        deleted: deleted.data.photocards,
        duplicates: duplicates.data.photocards,
      });
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching photocards: ${getErrorMessage(err)}`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setAllPhotocards({
        flagged: [],
        blocked: [],
        deleted: [],
        duplicates: [],
      });
    } finally {
      setLoading(false);
    }
  }, [openMessage, setError]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Always fetch counts first
      await fetchPhotocardCounts();
      await fetchUserCounts();

      // Fetch data based on active tab
      if (activeTab === "photocards") {
        // For the main photocards tab, use the status parameter approach
        const response = await apiClient.get(
          `/admin/photocards?status=${photocardFilter}`
        );
        setAllPhotocards((prev) => ({
          ...prev,
          [photocardFilter]: response.data.photocards || [],
        }));
      } else if (activeTab === "duplicates") {
        // Use the dedicated duplicates endpoint
        const response = await apiClient.get("/admin/photocards/duplicates");
        setAllPhotocards((prev) => ({
          ...prev,
          duplicates: response.data.photocards || [],
        }));
      } else if (activeTab === "blocked") {
        const response = await apiClient.get(
          "/admin/photocards?status=blocked"
        );
        setAllPhotocards((prev) => ({
          ...prev,
          blocked: response.data.photocards || [],
        }));
      } else if (activeTab === "deleted") {
        const response = await apiClient.get("/admin/photocards/deleted");
        setAllPhotocards((prev) => ({
          ...prev,
          deleted: response.data.deletedPhotocards || [],
        }));
      } else if (activeTab === "verifications") {
        await fetchVerifications();
      } else if (activeTab === "users") {
        await fetchUsers();
      }
    } catch (err) {
      const errorMessage = `Error fetching admin data: ${getErrorMessage(err)}`;
      openMessage("Error", errorMessage, "error");
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    photocardFilter,
    fetchPhotocardCounts,
    fetchUserCounts,
    fetchVerifications,
    fetchUsers,
    openMessage,
  ]);
  // --- EFFECTS ---
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData, activeTab, photocardFilter]);

  // --- HANDLERS ---
  const handleAction = useCallback(
    async (apiCall, successTitle, successMessage, errorMessagePrefix) => {
      setIsProcessingAction(true);
      try {
        await apiCall();
        openMessage(successTitle, successMessage, "success");
        fetchDashboardData();
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
      openConfirm(
        "Block Photocard,",
        `Are you sure you want to BLOCK this photocard?`,
        async () => {
          await handleAction(
            async () => apiClient.put(`/admin/photocards/${photocardId}/block`),
            "Success",
            "Photocard has been blocked!",
            "Failed to block photocard."
          );
        }
      );
    },
    [openConfirm, handleAction]
  );

  const handleUnblockPhotocard = useCallback(
    (photocardId) => {
      openConfirm(
        "Unblock Photocard",
        `Are you sure you want to UNBLOCK this photocard?`,
        async () => {
          await handleAction(
            async () =>
              apiClient.put(`/admin/photocards/${photocardId}/unblock`),
            "Success",
            "Photocard has been unblocked!",
            "Failed to unblock photocard."
          );
        }
      );
    },
    [openConfirm, handleAction]
  );

  const handleUnflagPhotocard = useCallback(
    (photocardId) => {
      openConfirm(
        "Unflag Photocard",
        "Are you sure you want to unflag this photocard?",
        async () => {
          await handleAction(
            async () =>
              apiClient.put(`/admin/photocards/${photocardId}/unflag`),
            "Success",
            "Photocard unflagged successfully",
            "Failed to unflag this photocard."
          );
        }
      );
    },
    [openConfirm, handleAction]
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
            "Failed to restore photocard."
          );
        }
      );
    },
    [openConfirm, handleAction]
  );

  const handleSoftDeletePhotocard = useCallback(
    (photocardId) => {
      openConfirm(
        "Delete Photocard",
        "Are you sure you want to soft delete this photocard? It will be moved to deleted items.",
        async () => {
          handleAction(
            async () => {
              await apiClient.delete(
                `/admin/photocards/${photocardId}/soft-delete`
              );
            },
            "Success",
            "Photocard moved to deleted items",
            "Failed to delete photocard!"
          );
        }
      );
    },
    [openConfirm, handleAction]
  );

  const handleHardDeletePhotocard = useCallback(
    (photocardId) => {
      openConfirm(
        "Delete Photocard",
        "WARNING: This will PERMANENTLY DELETE this photocard from the database. This cannot be undone!",
        async () => {
          handleAction(
            async () => {
              await apiClient.delete(`/admin/photocards/${photocardId}`);
            },
            "Success",
            "Photocard deleted successfully!",
            "Failed to delete photocard!"
          );
        }
      );
    },
    [openConfirm, handleAction]
  );

  const handlePhotocardClick = useCallback((photocardId) => {
    setBioDisplayModalPhotoId(photocardId);
    setIsBioDisplayModalOpen(true);
  }, []);

  const handleCloseBioDisplayModal = useCallback(() => {
    setIsBioDisplayModalOpen(false);
    setBioDisplayModalPhotoId(null);
  }, []);

  const handleViewReportsOrDuplicates = useCallback(
    async (photocardId) => {
      setLoading(true);
      setError(null);

      try {
        const reportsResponse = await apiClient.get(
          `/admin/reports/${photocardId}?itemType=photocard`
        );
        const reports = reportsResponse.data.reports;
        const duplicateReport = reports.find(
          (r) => r.reasonType === "duplicate" && r.duplicateOf._id
        );

        if (duplicateReport) {
          const originalPhotocardId = duplicateReport.duplicateOf._id;
          const comparisonResponse = await apiClient.get(
            `/admin/photocards/compare-suspected/${photocardId}/${originalPhotocardId}`
          );
          setDuplicatePhotocardInfo(comparisonResponse.data);
          setIsDuplicateModalOpen(true);
        } else {
          setSelectedReportPhotocardId(photocardId);
          setIsReportModalOpen(true);
        }
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
    [openMessage, setError]
  );

  const handleViewDeletionReport = useCallback(
    async (photocardId) => {
      setLoading(true);
      try {
        const response = await apiClient.get(
          `/admin/photocards/${photocardId}`
        );
        setSelectedDeletionReport(response.data.photocard);
        setIsReportModalOpen(true);
      } catch (err) {
        const errorMessage = `Failed to fetch deletion report: ${getErrorMessage(
          err
        )}`;
        openMessage("Error", errorMessage, "error");
      } finally {
        setLoading(false);
      }
    },
    [openMessage]
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
            "Failed to unmark photocard as duplicate."
          );
          handleCloseDuplicateModal();
        }
      );
    },
    [openConfirm, handleAction, handleCloseDuplicateModal]
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
            "Failed to block user."
          );
        }
      );
    },
    [openConfirm, handleAction]
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
            `Failed to unblock user ${username}`
          );
        }
      );
    },
    [openConfirm, handleAction]
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
            `Failed to delete user ${username}`
          );
        }
      );
    },
    [openConfirm, handleAction]
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

  const getCurrentPhotocardList = () => {
    switch (activeTab) {
      case "photocards":
        return photocardFilter === "flagged"
          ? allPhotocards.flagged || []
          : allPhotocards.blocked || [];
      case "duplicates":
        return allPhotocards.duplicates || [];
      case "deleted":
        return allPhotocards.deleted || [];
      default:
        return [];
    }
  };

  const currentPhotocardList = getCurrentPhotocardList();
  const isPhotocardActive = activeTab === "photocards";
  const isDuplicateActive = activeTab === "duplicates";
  const isVerificationActive = activeTab === "verifications";
  const isDeletedActive = activeTab === "deleted";
  const isUserActive = activeTab === "users";

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
          className={`tab-button ${isPhotocardActive ? "active" : ""}`}
          onClick={() => setActiveTab("photocards")}
          disabled={isProcessingAction}
        >
          Manage Photocards
        </button>
        <button
          className={`tab-button ${isDuplicateActive ? "active" : ""}`}
          onClick={() => setActiveTab("duplicates")}
          disabled={isProcessingAction}
        >
          <FontAwesomeIcon icon={faClone} /> Duplicate Photocards
        </button>
        <button
          className={`tab-button ${isVerificationActive ? "active" : ""}`}
          onClick={() => setActiveTab("verifications")}
          disabled={isProcessingAction}
        >
          Verifications
        </button>
        <button
          className={`tab-button ${isDeletedActive ? "active" : ""}`}
          onClick={() => setActiveTab("deleted")}
          disabled={isProcessingAction}
        >
          <FontAwesomeIcon icon="trash" /> Deleted Photocards
        </button>
        <button
          className={`tab-button ${isUserActive ? "active" : ""}`}
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
              <span>Flagged ({allPhotocards.flagged?.length || 0})</span>
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
              <span>Blocked ({allPhotocards.blocked?.length || 0})</span>
            </label>
          </div>
          <div className="photocard-list">
            {currentPhotocardList?.length > 0 ? (
              currentPhotocardList.map((photocard) => (
                <AdminPhotocardItem
                  key={photocard._id}
                  photocard={photocard}
                  user={user}
                  onPhotocardClick={handlePhotocardClick}
                  onBlock={handleBlockPhotocard}
                  onUnblock={handleUnblockPhotocard}
                  onRestore={handleUnflagPhotocard}
                  onDelete={handleSoftDeletePhotocard}
                  onViewDuplicates={handleViewDuplicates}
                  onViewReport={handleViewReportsOrDuplicates}
                  isProcessingAction={isProcessingAction}
                  isDeleted={false}
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
          <h2>Duplicate Photocards</h2>
          <p>
            These photocards are either flagged as potential duplicates by users
            or identified as such based on shared names and details.
          </p>
          <div className="photocard-list">
            {allPhotocards.duplicates.length > 0 ? (
              allPhotocards.duplicates.map((photocard) => (
                <AdminPhotocardItem
                  key={photocard._id}
                  photocard={{ ...photocard, isDuplicate: true }}
                  user={user}
                  onPhotocardClick={handlePhotocardClick}
                  onBlock={handleBlockPhotocard}
                  onUnblock={handleUnblockPhotocard}
                  onRestore={handleUnflagPhotocard}
                  onDelete={handleSoftDeletePhotocard}
                  isDeleted={false}
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
            {allPhotocards.deleted.length > 0 ? (
              allPhotocards.deleted.map((photocard) => (
                <AdminPhotocardItem
                  key={photocard._id}
                  photocard={photocard}
                  user={user}
                  onPhotocardClick={handlePhotocardClick}
                  onRestore={handleRestoreFromDeleted}
                  onDelete={handleHardDeletePhotocard}
                  onViewReport={handleViewDeletionReport}
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
                  onViewReport={handleViewReportsOrDuplicates}
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
        deletionReport={selectedDeletionReport}
      />

      <DuplicateDisplayModal
        isOpen={isDuplicateModalOpen}
        onClose={handleCloseDuplicateModal}
        duplicatePhotocardInfo={duplicatePhotocardInfo}
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
