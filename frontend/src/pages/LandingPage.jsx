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

const QUESTIONS = [
  "My aggregate is 18 — can I still do Science?",
  "My parents want medicine. I want design.",
  "Is a public day school enough for engineering?",
  "What if I miss the KNUST cutoff?",
  "Which electives do I actually need?",
  "Can I afford this programme?",
];

const BENEFITS = [
  {
    Icon: RiRouteLine,
    heading: "It asks before it answers",
    text: "Twelve questions about your stage, strengths, family, and money — because advice that ignores your situation is just noise.",
  },
  {
    Icon: RiBookOpenLine,
    heading: "It weighs what you value",
    text: "Passion or pay, or somewhere between. Every path is scored against what you said matters, not what looks impressive.",
  },
  {
    Icon: RiSchoolLine,
    heading: "It names real numbers",
    text: "Actual BECE and WASSCE aggregates, actual cutoffs, actual schools — so you know exactly what you're aiming at.",
  },
];

const STATS = [
  { value: "107", label: "Career paths mapped" },
  { value: "134", label: "University programmes" },
  { value: "50", label: "SHS schools profiled" },
  { value: "Free", label: "Always, for every student" },
];

const CATEGORIES = [
  {
    title: "Science & Health",
    roles: "Doctor · Nurse · Pharmacist · Lab Scientist",
    aggregate: "BECE 6–15",
    image: doctorImg,
  },
  {
    title: "Engineering & Tech",
    roles: "Software Developer · Civil Engineer · Architect",
    aggregate: "BECE 6–12",
    image: developerImg,
  },
  {
    title: "Business & Finance",
    roles: "Accountant · Banker · Actuary · Economist",
    aggregate: "BECE 6–14",
    image: lawyerImg,
  },
  {
    title: "Arts & Law",
    roles: "Lawyer · Journalist · Graphic Designer",
    aggregate: "BECE 6–16",
    image: teacherImg,
  },
  {
    title: "Teaching & Public Service",
    roles: "Teacher · Public Health Officer · HR Manager",
    aggregate: "BECE 6–20",
    image: studentImg,
  },
  {
    title: "TVET & Skilled Trades",
    roles: "Automotive Technician · Site Supervisor · Installer",
    aggregate: "BECE 6–20",
    image: engineerImg,
  },
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
          Answer twelve short questions about you — then get a personal guide
          for subjects, schools, and grades from JHS to university.
        </p>

        <Link
          to="/start"
          className="inline-flex items-center gap-3 bg-navy text-white px-7 py-4 rounded-full font-semibold text-base transition-all duration-150 hover:bg-navy-light hover:-translate-y-px"
        >
          Start Planning My Path
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full font-bold bg-gold text-navy shrink-0">
            →
          </span>
        </Link>

        {/* Photo fan - Made container taller and cards wider */}
        <div
          className="flex items-end justify-center gap-2 md:gap-[14px] mt-4 h-[300px] sm:h-[400px] md:h-[500px] scale-[0.55] sm:scale-75 md:scale-100 origin-bottom"
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

      {/* ══════════════════════ REAL QUESTIONS MARQUEE ══════════════════════ */}
      <section className="border-y border-border bg-white py-7 overflow-hidden">
        <div className="flex gap-3 w-max animate-[marquee_46s_linear_infinite] hover:[animation-play-state:paused]">
          {[...QUESTIONS, ...QUESTIONS].map((q, i) => (
            <span
              key={i}
              className="shrink-0 text-sm text-fg-soft bg-cream border border-border rounded-full px-5 py-2.5 whitespace-nowrap"
            >
              <span className="text-gold mr-2">“</span>
              {q}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════════════════ BENEFITS ══════════════════════ */}
      <section className="py-24 px-8">
        <div className="max-w-[960px] mx-auto grid md:grid-cols-[0.85fr_1.15fr] gap-12 md:gap-16 items-start">
          <div className="md:sticky md:top-24">
            <p className="text-xs uppercase tracking-[0.15em] text-gold mb-5">
              Why it's different
            </p>
            <h2
              className="text-[clamp(1.875rem,3.5vw,2.5rem)] text-fg leading-[1.15]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Most advice is
              <br />
              <em className="not-italic text-fg-muted">generic.</em>
              <br />
              Yours shouldn't be.
            </h2>
          </div>

          <div className="flex flex-col">
            {BENEFITS.map((b, i) => (
              <div
                key={b.heading}
                className={`flex gap-5 py-7 ${
                  i !== 0 ? "border-t border-border" : "pt-0"
                }`}
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white border border-border shrink-0 text-navy">
                  <b.Icon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg mb-1.5 leading-snug">
                    {b.heading}
                  </h3>
                  <p className="text-fg-soft leading-[1.7]">{b.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ HOW IT WORKS ══════════════════════ */}
      <section id="how-it-works" className="bg-white py-24 px-8">
        <div className="max-w-[960px] mx-auto mb-14">
          <p className="text-xs uppercase tracking-[0.15em] text-gold mb-5">
            How it works
          </p>
          <h2
            className="text-[clamp(1.875rem,4vw,2.75rem)] text-fg leading-[1.15] max-w-[16ch]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            One conversation. Then a plan you can act on.
          </h2>
        </div>

        <div className="max-w-[960px] mx-auto grid md:grid-cols-[1.05fr_0.95fr] gap-4">
          {/* 01 — dark card with chat preview */}
          <div className="rounded-[20px] p-8 flex flex-col bg-navy md:row-span-2">
            <StepNum n="01" light />
            <h3 className="text-xl font-semibold text-white leading-[1.3] mb-3">
              Tell Caria your situation
            </h3>
            <p className="leading-[1.7] text-white/65">
              Twelve questions — school stage, strengths, who's influencing you,
              what your family can afford. Tap an answer or type your own.
            </p>

            <div className="flex flex-col gap-3 mt-auto pt-8">
              <div className="self-start text-[13px] leading-[1.5] px-4 py-2.5 rounded-[14px] rounded-bl-[4px] max-w-[92%] text-white/80 bg-white/[8%] border border-white/10">
                Who has the biggest voice in your path right now?
              </div>
              <div className="self-end bg-gold text-navy text-[13px] font-medium leading-[1.5] px-4 py-2.5 rounded-[14px] rounded-br-[4px] max-w-[85%]">
                Mix of family and me
              </div>
              <div className="self-start text-[13px] leading-[1.5] px-4 py-2.5 rounded-[14px] rounded-bl-[4px] max-w-[92%] text-white/80 bg-white/[8%] border border-white/10">
                Money shapes real options. What's realistic for school costs?
              </div>
              <div className="self-end bg-gold text-navy text-[13px] font-medium leading-[1.5] px-4 py-2.5 rounded-[14px] rounded-br-[4px] max-w-[85%]">
                Public day school is realistic
              </div>
            </div>
          </div>

          {/* 02 — light card with scored result preview */}
          <div className="rounded-[20px] p-8 flex flex-col bg-cream border border-border">
            <StepNum n="02" />
            <h3 className="text-xl font-semibold text-fg leading-[1.3] mb-3">
              Get paths scored for you
            </h3>
            <p className="text-fg-soft leading-[1.7] mb-6">
              Every career is weighed on fit and on money — then ranked by what
              you said matters most.
            </p>

            <div className="mt-auto flex flex-col gap-2">
              <ScoreRow name="Software Developer" fit={91} tone="navy" />
              <ScoreRow name="Telecoms Engineer" fit={78} tone="navy" />
              <ScoreRow name="Medical Doctor" fit={34} tone="muted" />
            </div>
          </div>

          {/* 03 — gold card */}
          <div className="rounded-[20px] p-8 flex flex-col bg-gold">
            <StepNum n="03" light />
            <h3 className="text-xl font-semibold text-navy leading-[1.3] mb-3">
              Ask the hard questions
            </h3>
            <p className="leading-[1.7] text-navy/70">
              Cutoffs, backup plans, or how to tell your parents you'd rather
              design than diagnose. Your profile is already understood.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════════ STATS ══════════════════════ */}
      <section className="bg-navy py-16 px-8">
        <div className="max-w-[960px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-y-10">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col items-center gap-2 px-4 text-center ${
                i < STATS.length - 1 ? "md:border-r md:border-white/10" : ""
              }`}
            >
              <span
                className="text-[2.75rem] leading-none text-gold-light"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {s.value}
              </span>
              <span className="text-sm text-white/50 leading-snug max-w-[14ch]">
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-white/30 mt-12 max-w-[52ch] mx-auto leading-relaxed">
          Cutoff and school data currently covers Greater Accra and the Central
          Region most deeply — we're expanding region by region.
        </p>
      </section>

      {/* ══════════════════════ CAREER CATEGORIES ══════════════════════ */}
      <section id="careers" className="py-24 px-8 bg-cream">
        <div className="max-w-[960px] mx-auto mb-12 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-gold mb-5">
              Career directory
            </p>
            <h2
              className="text-[clamp(1.875rem,4vw,2.75rem)] text-fg leading-[1.15] max-w-[14ch]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every path, with the numbers attached
            </h2>
          </div>
          <Link
            to="/explore"
            className="text-sm font-medium text-navy border-b border-gold pb-0.5 hover:text-gold transition-colors duration-150"
          >
            Browse all 107 careers →
          </Link>
        </div>

        <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATEGORIES.map((c) => (
            <Link
              key={c.title}
              to="/explore"
              className="group relative rounded-[20px] overflow-hidden flex flex-col justify-end transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ minHeight: 300 }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${c.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/70 to-navy/10" />

              <div className="relative p-6">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-[0.12em] text-navy bg-gold rounded-full px-2.5 py-1 mb-3">
                  {c.aggregate}
                </span>
                <h3 className="text-xl font-semibold text-white mb-1.5">
                  {c.title}
                </h3>
                <p className="text-sm text-white/60 leading-relaxed">
                  {c.roles}
                </p>
              </div>
            </Link>
          ))}
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
        <p className="text-base text-white/50 mb-8 leading-[1.6] max-w-[46ch] mx-auto">
          Twelve questions. About three minutes. Then a plan built around your
          grades, your region, and what your family can actually afford.
        </p>
        <Link
          to="/start"
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

function ScoreRow({ name, fit, tone }) {
  const muted = tone === "muted";
  return (
    <div className="flex items-center gap-3">
      <span
        className={`text-[13px] w-[9.5rem] shrink-0 truncate ${
          muted ? "text-fg-muted" : "text-fg"
        }`}
      >
        {name}
      </span>
      <span className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
        <span
          className={`block h-full rounded-full ${
            muted ? "bg-fg-muted/40" : "bg-navy"
          }`}
          style={{ width: `${fit}%` }}
        />
      </span>
      <span
        className={`text-[11px] font-semibold tabular-nums w-8 text-right ${
          muted ? "text-fg-muted" : "text-navy"
        }`}
      >
        {fit}%
      </span>
    </div>
  );
}
