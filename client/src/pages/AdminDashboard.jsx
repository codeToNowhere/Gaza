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
import ReportDisplayModal from "../modals/ReportDisplayModal";
import DuplicateDisplayModal from "../modals/DuplicateDisplayModal";
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

  const [photocardCounts, setPhotocardCounts] = useState({
    flagged: 0,
    blocked: 0,
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
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load user counts."
      );
      setUserCounts({ flagged: 0, blocked: 0, total: 0 });
    }
  }, [setError]);

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
      const errorMessage = `Error fetching ${photocardFilter} photocards: ${
        err.response?.data?.message || err.message
      }`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setPhotocards([]);
    } finally {
      setLoading(false);
    }
  }, [photocardFilter, openMessage, setError]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/users");
      // Filter out current admin
      const rawUsers = Array.isArray(response.data.users)
        ? response.data.users
        : [];
      const filteredUsers = rawUsers.filter((u) => u._id !== user.id);
      setUsers(filteredUsers);
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching users: ${
        err.response?.data?.message || err.message
      }`;
      openMessage("Error", errorMessage, "error");
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [user, openMessage, setError]);

  const fetchDuplicatePhotocards = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/admin/photocards/duplicates");
      setDuplicatePhotocards(
        Array.isArray(response.data.photocards) ? response.data.photocards : []
      );
      setError(null);
    } catch (err) {
      const errorMessage = `Error fetching duplicate photocards: ${
        err.response?.data?.message || err.message
      }`;
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
      const errorMessage = `Error fetching verifications: ${
        err.response?.data?.message || err.message
      }`;
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
    }
  }, [
    activeTab,
    fetchPhotocards,
    fetchUsers,
    fetchDuplicatePhotocards,
    fetchVerifications,
    fetchPhotocardCounts,
    fetchUserCounts,
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
        const errorMessage = `${errorMessagePrefix}: ${
          err.response?.data?.message || err.message
        }`;
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

        if (reportType === "photocard") {
          response = await apiClient.get(`/admin/reports/photocard/${itemId}`);
          reports = response.data.reports;

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
          response = await apiClient.get(`/admin/reports/user/${itemId}`);
          reports = response.data.reports;

          setSelectedReportPhotocardId(null);
          setSelectedReportUserId(itemId);
          setIsReportModalOpen(true);
        } else {
          throw new Error("Invalid report type provided.");
        }

        setError(null);
      } catch (err) {
        const errorMessage = `Failed to fetch report info: ${
          err.response?.data?.message || err.message
        }`;
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
        const errorMessage = `Failed to confirm duplicate: ${
          err.response?.data?.message || err.message
        }`;
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
        const errorMessage = `Failed to fetch duplicate photocard info: ${
          err.response?.data?.message || err.message
        }`;
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
          <h2>Pending Verifications</h2>{" "}
          {verifications.length === 0 ? (
            <p>No pending verifications found.</p>
          ) : (
            verifications.map((verification) => (
              <AdminVerificationReview
                key={verification._id}
                verification={verification}
                onUpdate={fetchVerifications}
              />
            ))
          )}
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
    </div>
  );
});

export default AdminDashboard;
