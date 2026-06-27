import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      className="bg-navy border-t border-white/5 pt-12 pb-8 px-8"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="max-w-[960px] mx-auto flex items-start justify-between gap-8 pb-8 border-b border-white/5 flex-wrap">
        {/* Brand */}
        <div>
          <p
            className="text-xl font-semibold text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Caria <span className="text-gold">Ghana</span>
          </p>
          <p className=" mt-2 leading-relaxed text-white/40">
            Career guidance built for Ghanaian students.
          </p>
        </div>

        {/* Nav links */}
        <div className="flex gap-6 items-center flex-wrap">
          <a
            href="/#how-it-works"
            className=" text-white/50 transition-colors duration-150 hover:text-gold"
          >
            How it works
          </a>
          <a
            href="/#careers"
            className=" text-white/50 transition-colors duration-150 hover:text-gold"
          >
            Careers
          </a>
          <Link
            to="/chat"
            className=" text-white/50 transition-colors duration-150 hover:text-gold"
          >
            Start Planning
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-[960px] mx-auto mt-6">
        <p className="text-xs text-white/25">
          © 2025 Caria Ghana · Built for Ghanaian Students
        </p>
      </div>
    </footer>
  );
}
