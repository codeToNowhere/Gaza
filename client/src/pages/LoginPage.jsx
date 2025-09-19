// LoginPage.jsx
// --- IMPORTS ---
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/pages/AuthForm.css";

const LoginPage = () => {
  const { login, isAuthenticated, loading, authError } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  // --- EFFECTS & HANDLERS ---
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password, rememberMe);
  };

  // --- RENDER ---
  if (loading && isAuthenticated) {
    return (
      <div className="auth-spinner-container">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h2>Log In</h2>
        <form onSubmit={handleSubmit}>
          {authError && <p className="error-message">{authError}</p>}
          <div className="auth-form-group">
            <label htmlFor="email">Email: </label>
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
          <div className="auth-form-group">
            <label htmlFor="password">Password: </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              disabled={loading}
            />
          </div>
          <div className="remember-me-container">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={loading}
            />
            <label htmlFor="rememberMe">Remember Me</label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Logging In..." : "Log In"}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Don't have an account?
            <Link to="/signup" className="signup-link">
              Sign Up
            </Link>
          </p>
          <p>
            <Link to="/forgot-password" className="forgot-password-link">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
