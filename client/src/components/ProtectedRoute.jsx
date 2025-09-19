// ProtectedRoute.jsx
import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";

/**
 * @param {object} props - Component props.
 * @param {React.ReactNode} props.children - The child components to render if authorized.
 * @param {boolean} [props.adminOnly=false] - If true, only allows admin user access.
 * @returns {React.ReactNode} - The children components, a redirect, or a loading message.
 */

const ProtectedRoute = memo(function ProtectedRoute({
  children,
  adminOnly = false,
}) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();

  // --- RENDER ---
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
});

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  adminOnly: PropTypes.bool,
};

export default ProtectedRoute;
