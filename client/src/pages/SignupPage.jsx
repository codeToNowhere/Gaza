// SignupPage.jsx
// --- IMPORTS ---
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";
import "../styles/pages/AuthForm.css";

const SignupPage = () => {
  const { signup, isAuthenticated, loading, authError } = useAuth();
  const navigate = useNavigate();

  // --- STATE MANAGEMENT ---
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // --- EFFECTS & HANDLERS ---
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup({ username, email, password });
  };

  // --- RENDER ---
  if (loading && !isAuthenticated) {
    return (
      <div className="auth-spinner-container">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-form-wrapper">
        <h2>Sign Up</h2>
        <form onSubmit={handleSubmit}>
          {authError && <p className="error-message">{authError}</p>}
          <div className="auth-form-group">
            <label htmlFor="username">Username: </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              minLength="3"
              maxLength="30"
              disabled={loading}
            />
          </div>
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
              autoComplete="new-password"
              disabled={loading}
            />
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>
        <div className="auth-links">
          <p>
            Already have an account?
            <Link to="/login" className="login-link">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
