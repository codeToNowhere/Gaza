// MyPhotocards.jsx

// --- IMPORTS ---
// React & Router Hooks
import { useState, useCallback, memo } from "react";
import { useNavigate } from "react-router-dom";
// Context
import { useToast } from "../context/ToastContext";
import { useAuth, apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
// Components
import BackToTopButton from "../components/BackToTopButton";
import Photocard from "../components/Photocard";
// Utilities
import { getErrorMessage } from "../utils/getErrorMessage";
// Styles
import "../styles/pages/MyPhotocards.css";

const MyPhotocards = memo(function MyPhotocards({
  photocards,
  refreshPhotocards,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { openConfirm } = useMessage();

  // --- STATE MANAGEMENT ---
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingPhotocardId, setDeletingPhotocardId] = useState(null);

  // --- HANDLERS ---
  const handleDelete = useCallback(
    async (photocardId) => {
      openConfirm(
        "Delete Photocard",
        "Are you sure you want to delete this photocard permanently? This cannot be undone.",
        async () => {
          setIsDeleting(true);
          setDeletingPhotocardId(photocardId);

          try {
            const response = await apiClient.delete(
              `/photocards/user/${photocardId}`
            );
            const data = response.data;

            if (!data.success) {
              throw new Error(data.message || "Failed to delete photocard.");
            }

            refreshPhotocards();
            showToast("Photocard deleted successfully!", "success");
          } catch (err) {
            const errorMessage = getErrorMessage(
              err,
              "Failed to delete photocard. Please try again."
            );
            showToast(`Delete failed: ${errorMessage}`, "error");
          } finally {
            setIsDeleting(false);
            setDeletingPhotocardId(null);
          }
        }
      );
    },
    [openConfirm, showToast, refreshPhotocards]
  );

  const handleEdit = useCallback(
    async (photocardId) => {
      navigate(`/upload/${photocardId}`);
    },
    [navigate]
  );

  // --- RENDER ---
  const disableActions = isDeleting;

  return (
    <div className="my-photocards-page">
      <h2>My Photocards</h2>
      {photocards.length === 0 ? (
        <div className="my-photocards-empty-state">
          <p className="my-photocards-info">
            You haven't uploaded any photocards yet.
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="upload-first-button"
          >
            Upload Your First Photocard
          </button>
        </div>
      ) : (
        <div className="my-photocards-grid">
          {photocards.map((photocard, index) => {
            return (
              <div key={photocard._id} className="my-photocards-item">
                <Photocard
                  photocard={photocard}
                  onClick={() =>
                    navigate(`/bio/${photocard._id}`, {
                      state: {
                        source: "myPhotocards",
                        photocardsList: photocards.map((p) => p._id),
                        initialIndex: index,
                      },
                    })
                  }
                  currentUser={user}
                />
                <div className="my-photocards-actions">
                  <button
                    onClick={() => handleEdit(photocard._id)}
                    className="edit-button"
                    disabled={disableActions}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(photocard._id)}
                    className="delete-button"
                    disabled={disableActions}
                  >
                    {isDeleting && deletingPhotocardId === photocard._id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <BackToTopButton />
    </div>
  );
});

export default MyPhotocards;
