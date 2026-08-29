import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * The active onboarding question, pinned above the composer so it never
 * scrolls away. Chips attach directly to the question they answer.
 * - Single-select: tap → sends immediately
 * - Multi-select: toggle, then Continue
 */
export default function QuestionCard({ question, onSelect, disabled = false }) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [question?.id]);

  if (!question) return null;

  const multi = !!question.multi;
  const { step, total } = question;

  const toggle = (label) => {
    if (disabled) return;
    if (!multi) {
      onSelect(label);
      return;
    }
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
    );
  };

  const handleContinue = () => {
    if (disabled || selected.length === 0) return;
    onSelect(selected.join(', '));
  };

  return (
    <div className="shrink-0 border-t border-border bg-white">
      <div className="max-w-[760px] mx-auto px-6 md:px-8 pt-5 pb-4">
        {/* Step meter */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold shrink-0">
            Question {step} of {total}
          </span>
          <span className="flex-1 h-px bg-border" />
          {multi && (
            <span className="text-[11px] text-fg-muted shrink-0">
              Choose any that apply
            </span>
          )}
        </div>

        {/* The question itself */}
        <div className="text-[17px] leading-[1.5] text-navy mb-4 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-semibold">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p>{children}</p>,
              strong: ({ children }) => <strong>{children}</strong>,
              em: ({ children }) => <em className="not-italic text-fg-soft">{children}</em>,
            }}
          >
            {question.prompt}
          </ReactMarkdown>
        </div>

        {/* Answer chips */}
        <div className="flex flex-wrap gap-2">
          {question.options?.map((opt) => {
            const isOn = selected.includes(opt.label);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => toggle(opt.label)}
                aria-pressed={multi ? isOn : undefined}
                className={`px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  isOn
                    ? 'bg-navy text-white border-navy'
                    : 'bg-white text-fg-soft border-border hover:border-navy hover:text-navy hover:-translate-y-px'
                }`}
              >
                {isOn && <span className="mr-1.5">✓</span>}
                {opt.label}
              </button>
            );
          })}
        </div>

        {multi && (
          <button
            type="button"
            disabled={disabled || selected.length === 0}
            onClick={handleContinue}
            className={`mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              selected.length > 0 && !disabled
                ? 'bg-navy text-white hover:bg-navy-light'
                : 'bg-border/60 text-fg-muted cursor-not-allowed'
            }`}
          >
            Continue
            {selected.length > 0 && (
              <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-gold text-navy text-[11px] font-bold">
                {selected.length}
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
