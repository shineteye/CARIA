import { Link } from "react-router-dom";
import { RiRouteLine, RiBookOpenLine, RiSchoolLine } from "react-icons/ri";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

// Import your images here
import doctorImg from "../assets/images/doctor.webp";
import engineerImg from "../assets/images/engineer.webp";
import studentImg from "../assets/images/student.webp";
import nurseImg from "../assets/images/nurse.webp";
import developerImg from "../assets/images/developer.webp";
import teacherImg from "../assets/images/teacher.webp";
import lawyerImg from "../assets/images/lawyer.webp";

/* ─── Data ─────────────────────────────────────────────── */

// Made cards significantly taller and wider
const GALLERY_CARDS = [
  { label: "Future Doctor", image: doctorImg, h: 280, r: -9, ty: 25 },
  { label: "Engineer", image: engineerImg, h: 340, r: -5, ty: 15 },
  { label: "Student", image: studentImg, h: 390, r: -2, ty: 6 },
  { label: "Nurse", image: nurseImg, h: 420, r: 0, ty: 0 },
  { label: "Developer", image: developerImg, h: 390, r: 2, ty: 6 },
  { label: "Teacher", image: teacherImg, h: 340, r: 5, ty: 15 },
  { label: "Lawyer", image: lawyerImg, h: 280, r: 9, ty: 25 },
];

const BENEFITS = [
  {
    Icon: RiRouteLine,
    heading: "Personalized Roadmaps",
    text: "A step-by-step academic plan built around your specific career goal.",
  },
  {
    Icon: RiBookOpenLine,
    heading: "Subject Guidance",
    text: "Know exactly which electives and core subjects to pick at every stage.",
  },
  {
    Icon: RiSchoolLine,
    heading: "School & Grade Targets",
    text: "See exactly which institutions and aggregate scores you need to aim for.",
  },
];

const STATS = [
  { value: "20+", label: "Career Paths" },
  { value: "3", label: "Partner Universities" },
  { value: "2", label: "Regions Covered" },
  { value: "100%", label: "Free to Use" },
];

/* ─── Page ──────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div
      className="bg-cream min-h-screen"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <Navbar />

      {/* ══════════════════════ HERO ══════════════════════ */}
      <section className="text-center pt-20 pb-0 px-8 overflow-hidden">
        <p className="text-xs uppercase tracking-[0.15em] text-gold mb-5">
          Career Guidance for Ghanaian Students
        </p>

        <h1
          className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.1] text-fg mb-6"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Know Your Path,
          <br />
          <em className="not-italic bg-gradient-to-br from-navy to-navy-light bg-clip-text text-transparent">
            Shape Your Future
          </em>
        </h1>

        <p className="text-lg text-fg-soft max-w-[500px] mx-auto mb-8 leading-[1.65]">
          From JHS to university — discover exactly what subjects, schools, and
          grades you need for the career you want.
        </p>

        <Link
          to="/chat"
          className="inline-flex items-center gap-3 bg-navy text-white px-7 py-4 rounded-full font-semibold text-base transition-all duration-150 hover:bg-navy-light hover:-translate-y-px"
        >
          Start Planning My Path
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full font-bold bg-gold text-navy shrink-0">
            →
          </span>
        </Link>

        {/* Photo fan - Made container taller and cards wider */}
        <div
          className="flex items-end justify-center gap-[14px]"
          style={{ height: 500 }} // Increased from 340 to 500
          aria-hidden="true"
        >
          {GALLERY_CARDS.map((card) => (
            <div
              key={card.label}
              className="w-[180px] rounded-[20px] overflow-hidden shrink-0 flex flex-col items-center justify-between px-4 pt-8 pb-5 transition-transform duration-200 hover:-translate-y-2 hover:z-10 relative group"
              style={{
                height: card.h,
                transform: `rotate(${card.r}deg) translateY(${card.ty}px)`,
              }}
            >
              {/* Background Image */}
              <div
                className="absolute inset-0 w-full h-full"
                style={{
                  backgroundImage: `url(${card.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "brightness(0.7)",
                }}
              />

              {/* Gradient Overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center justify-between w-full h-full">
                <span className="text-sm font-medium text-center tracking-[0.04em] text-white/95 bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  {card.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ BENEFITS ══════════════════════ */}
      <section className="border-t border-border py-16 px-8">
        <div className="grid grid-cols-3 gap-12 max-w-[860px] mx-auto text-center">
          {BENEFITS.map((b) => (
            <div key={b.heading}>
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-border mx-auto mb-4 text-navy">
                <b.Icon size={22} />
              </div>
              <h3 className="text-base font-semibold text-fg mb-2">
                {b.heading}
              </h3>
              <p className=" text-fg-soft leading-[1.65]">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section id="how-it-works" className="bg-white py-24 px-8">
        <div className="text-center max-w-[560px] mx-auto mb-12">
          <h2
            className="text-[clamp(1.875rem,4vw,2.75rem)] text-fg leading-[1.15] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Three Steps to
            <br />
            Your Future
          </h2>
          <p className="text-base text-fg-soft leading-[1.7]">
            Simple, clear, and built for Ghanaian students navigating a complex
            education system.
          </p>
        </div>

        <div className="grid grid-cols-2 grid-rows-2 gap-4 max-w-[960px] mx-auto">
          {/* 01 — tall dark card */}
          <div
            className="row-span-2 rounded-[20px] p-8 flex flex-col bg-navy"
            style={{ minHeight: 480 }}
          >
            <StepNum n="01" light />
            <h3 className="text-xl font-semibold text-white leading-[1.3] mb-3">
              Tell us your career goal
            </h3>
            <p className=" leading-[1.7] text-white/65">
              Share what you want to become — doctor, engineer, accountant, or
              anything else. Our AI understands Ghana's education landscape
              inside out.
            </p>

            <div className="flex flex-col gap-3 mt-auto pt-6">
              <div className="self-end bg-gold text-navy text-xs leading-[1.5] px-3.5 py-2.5 rounded-[14px] rounded-br-[4px] max-w-[85%]">
                I want to become a Software Engineer.
              </div>
              <div className="self-start text-xs leading-[1.5] px-3.5 py-2.5 rounded-[14px] rounded-bl-[4px] max-w-[85%] text-white/80 bg-white/[8%] border border-white/10">
                Great choice! Here's your roadmap from JHS to KNUST Computer
                Science…
              </div>
            </div>
          </div>

          {/* 02 — light card */}
          <div className="rounded-[20px] p-8 flex flex-col bg-cream border border-border">
            <StepNum n="02" />
            <h3 className="text-xl font-semibold text-fg leading-[1.3] mb-3">
              Get your full academic roadmap
            </h3>
            <p className=" text-fg-soft leading-[1.7]">
              Every step from JHS through BECE, SHS, WASSCE, and into university
              — mapped out clearly and completely.
            </p>
          </div>

          {/* 03 — gold card */}
          <div className="rounded-[20px] p-8 flex flex-col bg-gold">
            <StepNum n="03" light />
            <h3 className="text-xl font-semibold text-navy leading-[1.3] mb-3">
              Know which schools & grades
            </h3>
            <p className=" leading-[1.7] text-navy/70">
              See the subjects, aggregates, and institutions you need to hit
              your specific target — no guesswork.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <section className="grid grid-cols-4 bg-navy py-12 px-8">
        {STATS.map((s, i) => (
          <div
            key={s.label}
            className={`flex flex-col items-center gap-2 py-6 px-4 text-center${
              i < STATS.length - 1 ? " border-r border-white/10" : ""
            }`}
          >
            <span
              className="text-4xl font-bold text-gold-light"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {s.value}
            </span>
            <span className=" text-white/50">{s.label}</span>
          </div>
        ))}
      </section>

      {/* ══════════════════════ CAREER CATEGORIES ══════════════════════ */}
      <section id="careers" className="py-24 px-8 bg-cream">
        <div className="text-center max-w-[560px] mx-auto mb-12">
          <h2
            className="text-[clamp(1.875rem,4vw,2.75rem)] text-fg leading-[1.15] mb-4"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Explore Career Paths
          </h2>
          <p className="text-base text-fg-soft leading-[1.7]">
            From science to the arts — we cover the full spectrum of Ghanaian
            career options.
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-[960px] mx-auto">
          <div className="flex gap-4">
            {/* Science & Health */}
            <div
              className="rounded-[20px] overflow-hidden bg-navy flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ flex: 1.5, minHeight: 260 }}
            >
              <div
                className="flex-1"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(255,255,255,0.03) 0%,rgba(240,201,58,0.08) 100%)",
                  minHeight: 100,
                }}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Science &amp; Health
                </h3>
                <p className=" text-white/60 mb-4">
                  Doctor · Nurse · Pharmacist · Lab Scientist
                </p>
                <Link
                  to="/explore"
                  className=" font-medium text-white/75 hover:text-white transition-colors duration-150"
                >
                  Explore path →
                </Link>
              </div>
            </div>

            {/* Engineering & Tech */}
            <div
              className="flex-1 rounded-[20px] bg-white border border-border p-8 flex flex-col justify-end transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ minHeight: 260 }}
            >
              <h3 className="text-xl font-semibold text-fg mb-2">
                Engineering &amp; Tech
              </h3>
              <p className=" text-fg-soft mb-4">
                Software Engineer · Civil Engineer · Data Analyst · Architect
              </p>
              <Link
                to="/explore"
                className=" font-medium text-gold hover:text-navy transition-colors duration-150"
              >
                Explore path →
              </Link>
            </div>
          </div>

          <div className="flex gap-4">
            {/* Business & Finance */}
            <div
              className="flex-1 rounded-[20px] bg-white border border-border p-8 flex flex-col justify-end transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ minHeight: 260 }}
            >
              <h3 className="text-xl font-semibold text-fg mb-2">
                Business &amp; Finance
              </h3>
              <p className=" text-fg-soft mb-4">
                Accountant · Banker · Entrepreneur · Economist
              </p>
              <Link
                to="/explore"
                className=" font-medium text-gold hover:text-navy transition-colors duration-150"
              >
                Explore path →
              </Link>
            </div>

            {/* Arts & TVET */}
            <div
              className="rounded-[20px] overflow-hidden bg-gold flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ flex: 1.5, minHeight: 260 }}
            >
              <div
                className="flex-1"
                style={{
                  background:
                    "linear-gradient(160deg,rgba(13,27,62,0.06) 0%,rgba(13,27,62,0.18) 100%)",
                  minHeight: 100,
                }}
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-navy mb-2">
                  Arts &amp; TVET
                </h3>
                <p className=" text-navy/65 mb-4">
                  Journalist · Graphic Designer · Electrician · Chef
                </p>
                <Link
                  to="/explore"
                  className=" font-medium text-navy/75 hover:text-navy transition-colors duration-150"
                >
                  Explore path →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ BOTTOM CTA ══════════════════════ */}
      <section className="bg-navy text-center py-24 px-8">
        <p className="text-xs uppercase tracking-[0.15em] text-gold mb-5">
          Ready to get started?
        </p>
        <h2
          className="text-[clamp(2rem,5vw,3.5rem)] text-white leading-[1.2] mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Your future begins
          <br />
          <em className="not-italic text-gold-light">with one conversation.</em>
        </h2>
        <p className="text-base text-white/50 mb-8 leading-[1.6]">
          Built for every Ghanaian student — no sign-up needed.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-3 bg-white text-navy px-7 py-4 rounded-full font-semibold text-base transition-all duration-150 hover:bg-cream hover:-translate-y-px"
        >
          Start Planning My Path
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full font-bold bg-navy text-white shrink-0">
            →
          </span>
        </Link>
      </section>

      <Footer />
    </div>
  );
}

/* ─── Micro-components ──────────────────────────────────── */

function StepNum({ n, light }) {
  return (
    <span
      className={`block text-[3.5rem] font-bold leading-none mb-4 ${
        light ? "text-white/[12%]" : "text-fg/[8%]"
      }`}
      style={{ fontFamily: "var(--font-display)" }}
    >
      {n}
    </span>
  );
}
