import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpg";

export default function Navbar({ compact = false }) {
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout, loading } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 h-16 flex items-center justify-between px-8 bg-cream border-b border-border transition-shadow duration-150 ${
        scrolled ? "shadow-md" : ""
      }`}
    >
      <Link to="/" className="flex items-center gap-3">
        <img
          src={logo}
          alt="Caria AI logo"
          className="h-10 w-10 rounded-full object-contain bg-white"
        />
        <span
          className="font-medium text-lg text-fg"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Caria <span className="text-gold">AI</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {!compact && (
          <>
            <a
              href="/#how-it-works"
              className="text-fg-soft hover:text-gold transition-colors duration-150 hidden md:block text-sm"
            >
              How it works
            </a>
            <Link
              to="/explore"
              className="text-fg-soft hover:text-gold transition-colors duration-150 hidden md:block text-sm"
            >
              Careers
            </Link>
          </>
        )}

        {!loading && isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="font-semibold px-5 py-2 rounded-full bg-navy text-white border border-navy hover:bg-navy-light transition-all duration-150 text-sm"
            >
              Open advisor
            </Link>
            <button
              type="button"
              onClick={() => logout()}
              className="text-sm font-medium text-fg-soft hover:text-navy transition-colors hidden sm:inline"
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-fg-soft hover:text-navy transition-colors hidden sm:inline"
            >
              Log in
            </Link>
            <Link
              to="/start"
              className="font-semibold px-5 py-2 rounded-full bg-navy text-white border border-navy hover:bg-navy-light transition-all duration-150 text-sm"
            >
              Start Now
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
