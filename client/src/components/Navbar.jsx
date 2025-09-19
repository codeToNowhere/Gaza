// Navbar.jsx
// --- IMPORTS ---
import { useState, useCallback, memo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import "../styles/components/Navbar.css";

const Navbar = memo(function Navbar() {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prevState) => !prevState);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // --- RENDER ---
  return (
    <nav className="navbar">
      <div className="navbar-left-content">
        {user && <span className="navbar-user">Hi, {user.username}</span>}
      </div>

      <button
        className="menu-icon"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
      >
        <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
      </button>

      <div className="navbar-right-content">
        <div className="navbar-links">
          <Link to="/">Gallery</Link>
          <Link to="/upload">Upload</Link>
          {user && <Link to="/my-photocards">My Photocards</Link>}
          {user?.isAdmin && <Link to="/admin">Admin Dashboard</Link>}
        </div>

        {user ? (
          <button
            onClick={logout}
            className="navbar-button navbar-logout-button"
          >
            Logout
          </button>
        ) : (
          <Link to="/login" className="navbar-button navbar-login-button">
            Login
          </Link>
        )}
      </div>

      <div className={`mobile-nav-menu ${isMobileMenuOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMobileMenu}>
          Gallery
        </Link>
        <Link to="/upload" onClick={closeMobileMenu}>
          Upload
        </Link>
        {user && (
          <Link to="/my-photocards" onClick={closeMobileMenu}>
            My Photocards
          </Link>
        )}
        {user?.isAdmin && (
          <Link to="/admin" onClick={closeMobileMenu}>
            Admin Dashboard
          </Link>
        )}

        {user ? (
          <button
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
            className="navbar-button navbar-logout-button"
          >
            Logout
          </button>
        ) : (
          <Link
            to="/login"
            className="navbar-button navbar-login-button"
            onClick={closeMobileMenu}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
});

export default Navbar;
