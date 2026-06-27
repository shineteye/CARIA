import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo.jpg";

const NAV_LINKS = [
  { label: "Explore Careers", path: "/explore" },
  { label: "AI Advisor", path: "/chat" },
];

export default function AppHeader({ onNewSession }) {
  const location = useLocation();

  return (
    <header
      className="h-14 bg-white border-b border-border flex items-center justify-between px-8 shrink-0 z-40"
      style={{ fontFamily: "var(--font-body)" }}
    >
      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-3 font-bold text-base text-navy shrink-0"
      >
        <img
          src={logo}
          alt="Caria Ghana logo"
          className="h-9 w-9 rounded-full object-contain bg-white"
        />
        <span>
          Caria <span className="text-gold">Ghana</span>
        </span>
      </Link>

      {/* Centered nav */}
      <nav className="flex items-center gap-1">
        {NAV_LINKS.map(({ label, path }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={label}
              to={path}
              className={`px-4 py-2 rounded-full  font-medium transition-all duration-150 ${
                active
                  ? "bg-navy text-white"
                  : "text-fg-soft hover:bg-cream hover:text-navy"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right action */}
      <div className="shrink-0">
        {onNewSession ? (
          <button
            onClick={onNewSession}
            className="inline-flex items-center gap-1.5 bg-navy text-white  font-medium px-4 py-2 rounded-full hover:bg-navy-light transition-colors"
          >
            <span className="text-base leading-none">+</span>
            New Chat
          </button>
        ) : (
          <Link
            to="/chat"
            className="inline-flex items-center gap-1.5 bg-navy text-white  font-medium px-4 py-2 rounded-full hover:bg-navy-light transition-colors"
          >
            Start Advising
          </Link>
        )}
      </div>
    </header>
  );
}
