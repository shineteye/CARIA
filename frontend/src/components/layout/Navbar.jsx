import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/logo.jpg";

export default function Navbar({ compact = false }) {
  const [scrolled, setScrolled] = useState(false);

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
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3">
        <img
          src={logo}
          alt="Caria Ghana logo"
          className="h-10 w-10 rounded-full object-contain bg-white"
        />
        <span
          className="font-medium text-lg text-fg"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Caria <span className="text-gold">Ghana</span>
        </span>
      </Link>

      {/* Links + CTA */}
      <div className="flex items-center gap-8">
        {!compact && (
          <>
            <a
              href="/#how-it-works"
              className="text-fg-soft hover:text-gold transition-colors duration-150 hidden md:block"
            >
              How it works
            </a>
            <a
              href="/explore"
              className="text-fg-soft hover:text-gold transition-colors duration-150 hidden md:block"
            >
              Careers
            </a>
          </>
        )}
        <Link
          to="/chat"
          className="font-semibold px-5 py-2 rounded-full bg-navy text-white border border-navy hover:bg-navy-light transition-all duration-150"
        >
          Start Now
        </Link>
      </div>
    </nav>
  );
}
