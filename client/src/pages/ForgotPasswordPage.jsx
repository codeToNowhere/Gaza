// ForgotPasswordPage.jsx
// --- IMPORTS ---
import { useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import { authApiClient } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/pages/AuthForm.css";

const ForgotPasswordPage = () => {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await authApiClient.post("/api/auth/forgot-password", {
        email,
      });

      const successMessage =
        response.data.message ||
        "If an account with that email exists, a password reset link has been sent to your email.";
      setMessage(successMessage);
      showToast(successMessage, "info");
      setEmail("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to send reset email. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER ---
  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h2>Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
          <div className="auth-form-group">
            <label htmlFor="email">Enter your email address: </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        {loading && <Spinner />}
        <div className="auth-links">
          <p>
            Remembered your password?{" "}
            <Link to="/login" className="login-link">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
