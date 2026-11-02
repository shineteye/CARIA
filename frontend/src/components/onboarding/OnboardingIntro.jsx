/**
 * Pre-roll screen — the invitation, not the terms and conditions.
 *
 * It leads with what the student walks away with rather than what Caria needs
 * from them, and keeps the reassurances (short, reversible, no account) as
 * quiet cards under the fold of the eye instead of a list of caveats. The
 * personal questions still get their warning, but framed as care rather than
 * as a disclosure notice.
 */

const ASSURANCES = [
  {
    label: "3 minutes",
    body: "Twelve quick questions, and you can change any answer.",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
        <path d="M12 7.5V12l3 2" strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "No sign-up yet",
    body: "Start right away. Save your guide at the end if you like it.",
    icon: (
      <>
        <path
          d="M5 12.5l4.5 4.5L19 7.5"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ),
  },
  {
    label: "Built for Ghana",
    body: "Real schools, real programmes, real grades.",
    icon: (
      <>
        <path
          d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.5" strokeWidth="1.6" />
      </>
    ),
  },
];

export default function OnboardingIntro({ total, onStart, disabled }) {
  return (
    <div className="w-full max-w-[640px]">
      <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-gold mb-5">
        Welcome to Caria
      </p>

      <h1
        className="text-[34px] sm:text-[46px] leading-[1.12] text-navy mb-6"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Let's find the path
        <br />
        that fits you.
      </h1>

      <p className="text-[17px] sm:text-[18px] leading-[1.65] text-fg-soft mb-4">
        Answer {total} questions about school, what you enjoy, and what feels
        possible right now. You'll get a guide made for you: the subjects to
        focus on, the schools worth choosing, and what it really takes to get
        there.
      </p>

      <p className="text-[15px] leading-[1.65] text-fg-muted mb-9">
        Some questions get personal, like family and money. Answer them however
        you're comfortable. The more real your answers, the more useful the
        guide.
      </p>

      <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
        {ASSURANCES.map(({ label, body, icon }) => (
          <li
            key={label}
            className="rounded-2xl border border-border bg-white/70 px-4 py-4"
          >
            <span
              aria-hidden="true"
              className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gold-faint text-gold mb-3"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
              >
                {icon}
              </svg>
            </span>
            <p className="text-[14px] font-semibold text-navy mb-1">{label}</p>
            <p className="text-[13px] leading-[1.55] text-fg-soft">{body}</p>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="group inline-flex items-center gap-2.5 pl-8 pr-3 py-3.5 rounded-full bg-navy text-white font-semibold text-[16px] hover:bg-navy-light hover:-translate-y-px transition-all duration-150 shadow-md disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:px-8"
      >
        {disabled ? "Getting ready…" : "Let's begin"}
        {!disabled && (
          <span
            aria-hidden="true"
            className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gold text-navy shrink-0 transition-transform group-hover:translate-x-0.5"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        )}
      </button>

      <p className="mt-5 text-[13px] text-fg-muted">
        Free for every student in Ghana.
      </p>
    </div>
  );
}
