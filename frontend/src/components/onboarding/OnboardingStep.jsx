import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

/**
 * One question, one screen.
 *
 * Options are cards rather than chips: at full-screen size a chip row reads as a
 * chat affordance, and on the small Android screens most Ghanaian students use,
 * a 56px card with the label left and the state right stays tappable where a
 * wrapped chip row does not. The grid collapses to a single column under 640px.
 *
 * Single-select confirms and advances on its own; multi-select waits for
 * Continue. The free-text escape hatch stays collapsed so it never competes with
 * the options, but it survives — it feeds the profile's freeNotes.
 */

const ADVANCE_DELAY_MS = 260;

function splitAnswer(value) {
  if (!value) return [];
  return String(value)
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function OnboardingStep({
  question,
  priorAnswer,
  onSubmit,
  disabled = false,
}) {
  const [selected, setSelected] = useState([]);
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState("");
  const [confirming, setConfirming] = useState(null);
  const customRef = useRef(null);
  const advanceTimer = useRef(null);

  const multi = !!question?.multi;
  const optionLabels = question?.options?.map((o) => o.label) || [];

  // Reset per question, restoring an earlier answer when stepping back. Anything
  // they typed that isn't one of the options goes back into the custom field.
  useEffect(() => {
    const prior = splitAnswer(priorAnswer);
    const known = prior.filter((p) => optionLabels.includes(p));
    const unknown = prior.filter((p) => !optionLabels.includes(p));

    setSelected(known);
    setCustomText(unknown.join(", "));
    setCustomOpen(unknown.length > 0);
    setConfirming(null);
    // optionLabels is derived from question; keying on id is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, priorAnswer]);

  useEffect(() => () => clearTimeout(advanceTimer.current), []);

  useEffect(() => {
    if (customOpen) customRef.current?.focus();
  }, [customOpen]);

  if (!question) return null;

  const choose = (label) => {
    if (disabled) return;

    if (!multi) {
      // Flash the selection before advancing, so the choice is visibly
      // registered rather than the screen just vanishing.
      setSelected([label]);
      setConfirming(label);
      clearTimeout(advanceTimer.current);
      advanceTimer.current = setTimeout(() => onSubmit(label), ADVANCE_DELAY_MS);
      return;
    }

    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const custom = customText.trim();
  const combined = [...selected, ...(custom ? [custom] : [])];
  const canContinue = combined.length > 0 && !disabled;

  const handleContinue = () => {
    if (!canContinue) return;
    onSubmit(combined.join(", "));
  };

  // Single-select with only free text typed — Continue is the way out.
  const showContinue = multi || custom.length > 0;

  return (
    <div className="w-full">
      {question.helper && (
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-gold mb-3">
          {question.helper}
        </p>
      )}

      <div
        className="text-[26px] sm:text-[32px] leading-[1.25] text-navy mb-2 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <ReactMarkdown
          components={{
            p: ({ children }) => <p>{children}</p>,
            strong: ({ children }) => <strong>{children}</strong>,
            em: ({ children }) => (
              <em className="not-italic text-fg-soft">{children}</em>
            ),
          }}
        >
          {question.prompt}
        </ReactMarkdown>
      </div>

      {multi && (
        <p className="text-[14px] text-fg-soft mb-6">
          Choose as many as apply.
        </p>
      )}
      {!multi && <div className="mb-6" />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {question.options?.map((opt) => {
          const isOn = selected.includes(opt.label);
          const isConfirming = confirming === opt.label;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => choose(opt.label)}
              aria-pressed={multi ? isOn : undefined}
              className={`group flex items-center justify-between gap-3 min-h-[56px] px-4 py-3 rounded-xl border text-left text-[15px] transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                isOn
                  ? "bg-navy text-white border-navy shadow-md"
                  : "bg-white text-fg border-border hover:border-navy hover:shadow-sm"
              } ${isConfirming ? "scale-[0.98]" : ""}`}
            >
              <span className="font-medium">{opt.label}</span>
              <span
                aria-hidden="true"
                className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  isOn
                    ? "bg-gold border-gold"
                    : "border-border-strong group-hover:border-navy"
                }`}
              >
                {isOn && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 6L9 17l-5-5"
                      stroke="var(--navy)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Escape hatch — collapsed so it never competes with the options. */}
      <div className="mt-5">
        {!customOpen ? (
          <button
            type="button"
            onClick={() => setCustomOpen(true)}
            disabled={disabled}
            className="text-[14px] text-fg-muted hover:text-navy underline underline-offset-4 decoration-border transition-colors disabled:opacity-40"
          >
            None of these fit? Type your own
          </button>
        ) : (
          <div>
            <label
              htmlFor="onboarding-custom"
              className="block text-[13px] text-fg-soft mb-2"
            >
              {multi ? "Anything else?" : "In your own words"}
            </label>
            <textarea
              id="onboarding-custom"
              ref={customRef}
              rows={2}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder={question.placeholder || "Type your answer…"}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleContinue();
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-[15px] text-fg outline-none focus:border-navy transition-colors resize-none"
            />
          </div>
        )}
      </div>

      {showContinue && (
        <button
          type="button"
          disabled={!canContinue}
          onClick={handleContinue}
          className={`mt-6 inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[15px] font-semibold transition-all ${
            canContinue
              ? "bg-navy text-white hover:bg-navy-light shadow-md"
              : "bg-border/60 text-fg-muted cursor-not-allowed"
          }`}
        >
          Continue
          {multi && combined.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold text-navy text-[11px] font-bold tabular-nums">
              {combined.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
