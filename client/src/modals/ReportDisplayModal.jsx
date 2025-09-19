// ReportDisplayModal.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from "prop-types";
import { apiClient } from "../context/AuthContext";
import { useMessage } from "../context/MessageContext";
import Spinner from "../components/Spinner";
import { getErrorMessage } from "../utils/getErrorMessage";
import "../styles/modals/Modals.css";

const ReportDisplayModal = ({
  isOpen,
  onClose,
  reportId,
  photocardId,
  userId,
}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { openMessage } = useMessage();
  const modalRef = useRef();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    setReports([]);

    let endpoint = "";
    if (reportId) {
      endpoint = `/admin/reports/single/${reportId}`;
    } else if (photocardId) {
      endpoint = `/admin/reports/photocard/${photocardId}`;
    } else if (userId) {
      endpoint = `/admin/reports/user/${userId}`;
    } else {
      setLoading(false);
      setError("No item ID provided to fetch reports");
      return;
    }

    try {
      const response = await apiClient.get(endpoint);
      setReports(
        Array.isArray(response.data.reports) ? response.data.reports : []
      );
      if (reportId && response.data.report) {
        setReports([response.data.report]);
      }
      setError(null);
    } catch (err) {
      const errorMessage = getErrorMessage(
        err,
        "Failed to fetch report details."
      );
      setError(errorMessage);
      openMessage("Error", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [reportId, photocardId, userId, openMessage]);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    } else {
      setReports([]);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, reportId, photocardId, userId, fetchReports]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay report-display-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-display-modal-title"
    >
      <div
        className="modal-content"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="report-display-modal-title" className="modal-title">
          Report Details
        </h2>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>

        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : reports.length > 0 ? (
          reports.map((report, index) => (
            <div key={report._id || index} className="report-item">
              {reports.length > 1 && <h4>Report #{index + 1}</h4>}{" "}
              <p>
                <strong>Reported Item Type:</strong>{" "}
                {report.reportType === "photocard" ? "Photocard" : "User"}
              </p>
              {report.photocard && (
                <p>
                  <strong>Reported Photocard:</strong> {report.photocard.name}{" "}
                  (ID: {report.photocard._id})
                </p>
              )}{" "}
              {report.reportedUser && (
                <p>
                  <strong>Reported User</strong> {report.reportedUser.username}{" "}
                  (ID: {report.reportedUser._id})
                </p>
              )}{" "}
              <p>
                <strong>Reason Category:</strong> {report.reasonType}
              </p>
              {report.duplicateOf && (
                <p>
                  <strong>Reported as Duplicate of:</strong>{" "}
                  {report.duplicateOf.name} (ID: {report.duplicateOf._id})
                </p>
              )}
              <p>
                <strong>Reason Provided:</strong> {report.reason}
              </p>
              <p>
                <strong>Reported By:</strong>{" "}
                {report.reportedBy
                  ? `${report.reportedBy.username} (${report.reportedBy.email})`
                  : "N/A"}
              </p>
              <p>
                <strong>Report Date:</strong>{" "}
                {new Date(report.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {report.status}
              </p>{" "}
              {report.status !== "pending" && report.reviewedBy && (
                <p>
                  <strong>Reviewed:</strong> {report.reviewedBy.username} at{" "}
                  {new Date(report.reviewedAt).toLocaleString()}
                </p>
              )}{" "}
              {reports.length > 1 && index < reports.length - 1 && <hr />}{" "}
            </div>
          ))
        ) : (
          <p>No report details found.</p>
        )}

        <div className="modal-actions flex-end">
          <button
            type="button"
            className="modal-btn report-display-close-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ReportDisplayModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reportId: PropTypes.string,
  photocardId: PropTypes.string,
  userId: PropTypes.string,
};

export default ReportDisplayModal;
