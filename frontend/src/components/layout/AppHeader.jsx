import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpg";

const NAV_LINKS = [
  { label: "Explore Careers", path: "/explore" },
  { label: "AI Advisor", path: "/chat" },
];

export default function AppHeader({ onNewSession, onAvatarClick, variant = "app" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, loading } = useAuth();
  const isCream = variant === "cream";

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header
      className={`h-16 flex items-center justify-between px-6 md:px-8 shrink-0 z-40 border-b ${
        isCream
          ? "bg-cream border-border"
          : "bg-white/90 backdrop-blur-md border-border shadow-sm"
      }`}
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Link
        to="/"
        className="flex items-center gap-3 font-semibold text-base text-navy shrink-0"
      >
        <img
          src={logo}
          alt="Caria AI logo"
          className="h-9 w-9 rounded-full object-contain bg-white border border-border"
        />
        <span>
          Caria <span className="text-gold">AI</span>
        </span>
      </Link>

      <nav className="hidden sm:flex items-center gap-1">
        {NAV_LINKS.map(({ label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={label}
              to={path}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-navy text-white shadow-sm"
                  : "text-fg-soft hover:bg-cream hover:text-navy"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2 shrink-0">
        {onNewSession && isAuthenticated && (
          <button
            onClick={onNewSession}
            className="hidden md:inline-flex items-center gap-1.5 border border-border text-navy text-sm font-medium px-3.5 py-2 rounded-full hover:border-navy transition-colors"
          >
            <span className="text-base leading-none">+</span>
            New chat
          </button>
        )}

        {!loading && isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-sm font-semibold text-navy leading-tight max-w-[120px] truncate">
                {user.name?.split(" ")[0]}
              </span>
              <span className="text-[11px] text-fg-muted">Signed in</span>
            </div>
            {onAvatarClick ? (
              <button
                type="button"
                onClick={onAvatarClick}
                title="Edit your profile"
                aria-label="Edit your profile"
                className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center hover:ring-2 hover:ring-gold/60 transition-all"
              >
                {(user.name || "?").charAt(0).toUpperCase()}
              </button>
            ) : (
              <div className="w-9 h-9 rounded-full bg-navy text-white text-sm font-bold flex items-center justify-center">
                {(user.name || "?").charAt(0).toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium px-3.5 py-2 rounded-full text-fg-soft border border-border hover:border-navy hover:text-navy transition-colors"
            >
              Log out
            </button>
          </div>
        ) : !loading ? (
          <>
            <Link
              to="/login"
              className="text-sm font-medium px-3.5 py-2 rounded-full text-fg-soft hover:text-navy transition-colors"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 bg-navy text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-navy-light transition-colors shadow-sm"
            >
              Sign up
            </Link>
          </>
        ) : null}
      </div>
    </header>
  );
}
