// App.jsx
import { Routes, Route } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "./context/AuthContext";
import { usePhotocardData } from "./hooks/usePhotocardData";
import "./index.css";

// Pages
import AdminDashboard from "./pages/AdminDashboard";
import BioDetailPage from "./pages/BioDetailPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import Gallery from "./pages/Gallery";
import LoginPage from "./pages/LoginPage";
import MyPhotocards from "./pages/MyPhotocards";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SignupPage from "./pages/SignupPage";
import UploadForm from "./pages/UploadForm";

// Components
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";

const App = () => {
  const { user } = useAuth();

  const filters = useMemo(() => ({}), []);

  const {
    photocards,
    loadingPhotocards,
    counts,
    error,
    refreshPhotocards,
    pagination,
    goToPage,
  } = usePhotocardData(filters);

  const userPhotocards = useMemo(() => {
    if (!photocards || !user) return [];
    return photocards.filter(
      (photocard) => photocard.createdBy?._id?.toString() === user.id
    );
  }, [photocards, user?.id]);

  return (
    <>
      <Navbar user={user} />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              loadingPhotocards ? (
                <div className="loading-container">
                  <Spinner />
                  <p>Loading photocards...</p>
                </div>
              ) : (
                <Gallery
                  photocards={photocards}
                  refreshPhotocards={refreshPhotocards}
                  counts={counts}
                  error={error}
                  loadingPhotocards={loadingPhotocards}
                  pagination={pagination}
                  goToPage={goToPage}
                />
              )
            }
          />
          <Route
            path="/my-photocards"
            element={
              <ProtectedRoute>
                <MyPhotocards
                  photocards={userPhotocards}
                  refreshPhotocards={refreshPhotocards}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <UploadForm refreshPhotocards={refreshPhotocards} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload/:photocardId"
            element={
              <ProtectedRoute>
                <UploadForm refreshPhotocards={refreshPhotocards} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bio/:id"
            element={
              <ProtectedRoute>
                <BioDetailPage photocards={photocards} />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route
            path="/reset-password/:token"
            element={<ResetPasswordPage />}
          />
        </Routes>
      </main>
      <Footer />
    </>
  );
};

export default App;
