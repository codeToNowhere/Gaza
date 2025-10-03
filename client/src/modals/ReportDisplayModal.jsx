// ReportDisplayModal.jsx - Enhanced version
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
  deletionReport, // New prop for deletion reports
}) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { openMessage } = useMessage();
  const modalRef = useRef();

  const fetchReports = useCallback(async () => {
    // If deletionReport is provided, use it directly
    if (deletionReport) {
      setReports([deletionReport]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setReports([]);

    let endpoint = "";
    if (reportId) {
      endpoint = `/admin/reports/single/${reportId}`;
    } else if (photocardId) {
      endpoint = `/admin/reports/${photocardId}?itemType=photocard`;
    } else if (userId) {
      endpoint = `/admin/reports/${userId}?itemType=user`;
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
  }, [reportId, photocardId, userId, deletionReport, openMessage]);

  useEffect(() => {
    if (isOpen) {
      fetchReports();
    } else {
      setReports([]);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, reportId, photocardId, userId, deletionReport, fetchReports]);

  // Helper function to render deletion report
  const renderDeletionReport = (report) => {
    const getReportDetails = () => {
      switch (report.deleteReason) {
        case "rejected_identification":
          return {
            title: "Identification Rejection Report",
            description:
              "This identification submission was rejected by an admin.",
            fields: [
              {
                label: "Rejection Comments",
                value: report.rejectionComments || "No comments provided",
              },
              {
                label: "Original Photocard Number",
                value: `#${
                  report.photocardNumber
                    ?.toString()
                    .replace("ID", "")
                    ?.padStart(3, "0") || "N/A"
                }`,
              },
              {
                label: "Deleted At",
                value: new Date(report.deletedAt).toLocaleDateString(),
              },
            ],
          };

        case "restored_original":
          return {
            title: "Original Photocard Restored",
            description:
              "The original photocard was restored, moving the identified version to deleted items.",
            fields: [
              {
                label: "Restoration Reason",
                value: "Admin restored original version",
              },
              {
                label: "Photocard Number",
                value: `#${
                  report.photocardNumber?.toString().padStart(3, "0") || "N/A"
                }`,
              },
              {
                label: "Restored At",
                value: new Date(report.updatedAt).toLocaleDateString(),
              },
            ],
          };

        case "deleted_by_admin":
          return {
            title: "Admin Deletion Report",
            description: "This photocard was soft-deleted by an administrator.",
            fields: [
              {
                label: "Deletion Reason",
                value: report.deleteReason || "Not specified",
              },
              {
                label: "Deleted At",
                value: new Date(report.deletedAt).toLocaleDateString(),
              },
            ],
          };

        case "replaced_by_identification":
          return {
            title: "Identification Replacement Report",
            description:
              "This photocard was replaced by an identified version.",
            fields: [
              {
                label: "Replacement Reason",
                value: "Identified version approved",
              },
              {
                label: "Original Number",
                value: `#${
                  report.photocardNumber
                    ?.toString()
                    .replace("ID", "")
                    ?.padStart(3, "0") || "N/A"
                }`,
              },
              {
                label: "Replaced At",
                value: new Date(report.deletedAt).toLocaleDateString(),
              },
            ],
          };

        default:
          return {
            title: "Deletion Report",
            description: "This photocard has been soft-deleted.",
            fields: [
              {
                label: "Reason",
                value: report.deleteReason || "Not specified",
              },
              {
                label: "Deleted At",
                value: new Date(report.deletedAt).toLocaleDateString(),
              },
            ],
          };
      }
    };

    const reportDetails = getReportDetails();

    return (
      <div className="report-item deletion-report">
        <h3>{reportDetails.title}</h3>
        <p className="report-description">{reportDetails.description}</p>

        <div className="report-details">
          {reportDetails.fields.map((field, index) => (
            <div key={index} className="report-field">
              <strong>{field.label}:</strong>
              <span>{field.value}</span>
            </div>
          ))}
        </div>

        {report.flagged && (
          <div className="flagging-info">
            <h4>Flagging History</h4>
            <p>This photocard was previously flagged for review.</p>
            {report.flaggedReasonType && (
              <p>
                <strong>Flag Reason:</strong> {report.flaggedReasonType}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // Helper function to render flag report
  const renderFlagReport = (report, index) => {
    return (
      <div key={report._id || index} className="report-item flag-report">
        {reports.length > 1 && <h4>Report #{index + 1}</h4>}
        <p>
          <strong>Reported Item Type:</strong>{" "}
          {report.reportType === "photocard" ? "Photocard" : "User"}
        </p>
        {report.photocard && (
          <p>
            <strong>Reported Photocard:</strong> {report.photocard.name} (ID:{" "}
            {report.photocard._id})
          </p>
        )}
        {report.reportedUser && (
          <p>
            <strong>Reported User:</strong> {report.reportedUser.username} (ID:{" "}
            {report.reportedUser._id})
          </p>
        )}
        <p>
          <strong>Reason Category:</strong> {report.reasonType}
        </p>
        {report.duplicateOf && (
          <p>
            <strong>Reported as Duplicate of:</strong> {report.duplicateOf.name}{" "}
            (ID: {report.duplicateOf._id})
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
        </p>
        {report.status !== "pending" && report.reviewedBy && (
          <p>
            <strong>Reviewed:</strong> {report.reviewedBy.username} at{" "}
            {new Date(report.reviewedAt).toLocaleString()}
          </p>
        )}
        {reports.length > 1 && index < reports.length - 1 && <hr />}
      </div>
    );
  };

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
          {deletionReport ? "Deletion Report" : "Report Details"}
        </h2>
        <button className="modal-close-button" onClick={onClose}>
          &times;
        </button>

        {loading ? (
          <Spinner />
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : reports.length > 0 ? (
          reports.map((report, index) =>
            deletionReport
              ? renderDeletionReport(report)
              : renderFlagReport(report, index)
          )
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
  deletionReport: PropTypes.object, // New prop for deletion reports
};

export default ReportDisplayModal;
