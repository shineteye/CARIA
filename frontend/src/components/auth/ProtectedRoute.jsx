import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-4 bg-cream"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="w-10 h-10 rounded-full border-2 border-gold-faint border-t-gold animate-spin" />
        <p className="text-sm text-fg-muted">Checking your account…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    );
  }

  return children;
}
