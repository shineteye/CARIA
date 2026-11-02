/**
 * Segmented progress rail — one tick per question.
 *
 * A continuous bar hides how much is left; twelve discrete ticks tell a student
 * at a glance that this is short and finite, which is the whole reason they keep
 * going. Filled ticks are navy, the current one gold, the rest faint.
 */
export default function OnboardingProgress({ step, total, onBack, canGoBack }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-3">
        {canGoBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-[13px] text-fg-muted hover:text-navy transition-colors -ml-1 px-1 py-1"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>
        ) : (
          <span />
        )}
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.12em] text-fg-muted tabular-nums">
          {step} <span className="text-border-strong">/</span> {total}
        </span>
      </div>

      <div
        className="flex gap-1.5"
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${step} of ${total}`}
      >
        {Array.from({ length: total }, (_, i) => {
          const index = i + 1;
          const done = index < step;
          const current = index === step;
          return (
            <span
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                current ? "bg-gold" : done ? "bg-navy" : "bg-border"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
