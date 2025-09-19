// ResetPasswordPage.jsx
// --- IMPORTS ---
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { authApiClient } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/pages/AuthForm.css";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // --- STATE MANAGEMENT ---
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // --- EFFECTS & HANDLERS ---
  useEffect(() => {
    const checkTokenValidity = async () => {
      setIsPageLoading(true);
      setError("");

      if (!token) {
        const errorMessage =
          "No reset token found in URL. Please check your link.";
        setError(errorMessage);
        showToast(errorMessage, "error");
        setIsTokenValid(false);
        setIsPageLoading(false);
        return;
      }

      try {
        await authApiClient.get(`/api/auth/validate-reset-token/${token}`);
        setIsTokenValid(true);
        showToast("Reset link is valid. Please set your new password.", "info");
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          "The reset link is invalid or has expired. Please request a new one.";
        setError(errorMessage);
        showToast(errorMessage, "error");
        setIsTokenValid(false);
      } finally {
        setIsPageLoading(false);
      }
    };
    checkTokenValidity();
  }, [token, showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      const errorMessage = "Passwords do not match!";
      setError(errorMessage);
      showToast(errorMessage, "error");
      setLoading(false);
      return;
    }

    try {
      const response = await authApiClient.post("/api/auth/reset-password", {
        token,
        newPassword: password,
      });
      const successMessage =
        response.data.message ||
        "Your password has been reset successfully. You will be redirected to the login page.";
      setMessage(successMessage);
      showToast(successMessage, "success");

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to reset password. The link might be invalid or expired. Please request a new one.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  if (isPageLoading) {
    return (
      <div className="auth-spinner-container">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h2>Reset Password</h2>
        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}
        {isTokenValid ? (
          <form onSubmit={handleSubmit}>
            <div className="auth-form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
              />
            </div>
            <button type="submit" disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        ) : (
          <p className="auth-links">
            Please ensure you are using a valid and unexpired password reset
            link.
          </p>
        )}
        <div className="auth-links">
          <p>
            <Link to="/login" className="login-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
