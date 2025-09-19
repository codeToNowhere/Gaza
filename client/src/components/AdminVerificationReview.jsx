// AdminVerificationReview.jsx
import { useState } from "react";
import { apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";

const AdminVerificationReview = ({ verification, onUpdate }) => {
  const [comments, setComments] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { openMessage, openConfirm } = useMessage();

  const handleApprove = async () => {
    openConfirm(
      "Approve Identification",
      "Are you sure you want to approve this identification? This will create a new identified photocard.",
      async () => {
        setIsProcessing(true);
        try {
          await apiClient.put(
            `/admin/verifications/${verification._id}/approve`,
            { comments }
          );
          openMessage("Success", "Identification approved!", "success");
          onUpdate();
        } catch (err) {
          openMessage("Error", "Failed to approve identification", "error");
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  const handleReject = async () => {
    openConfirm(
      "Reject Identification",
      "Are you sure you want to reject this identification?",
      async () => {
        setIsProcessing(true);
        try {
          await apiClient.put(
            `/admin/verifications/${verification._id}/reject`,
            { comments }
          );
          openMessage("Success", "Identification rejected.", "success");
          onUpdate();
        } catch (err) {
          openMessage("Error", "Failed to reject identification.", "error");
        } finally {
          setIsProcessing(false);
        }
      }
    );
  };

  return (
    <div className="verification-review">
      <h3>Verification Review</h3>

      <div className="comparison">
        <div className="original">
          <h4>Original {Unidentified}</h4>
          <p>
            <strong>Name:</strong> {verification.originalPhotocard.name}
          </p>
          <p>
            <strong>Age:</strong> {verification.originalPhotocard.age}
          </p>
        </div>

        <div className="proposed">
          <h4>Proposed Identification</h4>
          <p>
            <strong>Name:</strong> {verification.proposedData.name}
          </p>
          <p>
            <strong>Age:</strong> {verification.proposedData.age}
          </p>
        </div>
      </div>

      <div className="review-actions">
        <textarea
          placeholder="Review comments (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows="3"
        />
        <div className="action-buttons">
          <button onClick={handleReject} disabled={isProcessing}>
            Reject
          </button>
          <button onClick={handleApprove} disabled={isProcessing}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminVerificationReview;
