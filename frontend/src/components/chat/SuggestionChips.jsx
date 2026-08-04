import { useState, useEffect } from 'react';

/**
 * Hybrid answer UI:
 * - Single-select: tap chip → send immediately
 * - Multi-select: toggle chips, then Continue
 * - Always works alongside free-text input above/below
 */
export default function SuggestionChips({
  question,
  onSelect,
  disabled = false,
  phase,
}) {
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    setSelected([]);
  }, [question?.id]);

  if (phase !== 'onboarding' || !question?.options?.length) return null;

  const multi = !!question.multi;

  const toggle = (label) => {
    if (disabled) return;
    if (!multi) {
      onSelect(label);
      return;
    }
    setSelected((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label],
    );
  };

  const handleContinue = () => {
    if (disabled || selected.length === 0) return;
    onSelect(selected.join(', '));
  };

  return (
    <div className="px-6 pb-2 shrink-0">
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => {
          const isOn = selected.includes(opt.label);
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => toggle(opt.label)}
              className={`px-3.5 py-2 rounded-full border text-[13px] font-medium transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                isOn
                  ? 'bg-navy text-white border-navy shadow-sm'
                  : 'bg-white text-fg-soft border-border hover:border-navy hover:text-navy'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {multi && (
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            disabled={disabled || selected.length === 0}
            onClick={handleContinue}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
              selected.length > 0 && !disabled
                ? 'bg-navy text-white'
                : 'bg-gray-200 text-fg-muted cursor-not-allowed'
            }`}
          >
            Continue{selected.length > 0 ? ` (${selected.length})` : ''}
          </button>
          <span className="text-[12px] text-fg-muted">
            Or type a custom answer below
          </span>
        </div>
      )}

      {!multi && (
        <p className="text-[12px] text-fg-muted mt-2">
          Tap a choice — or type something more detailed below
        </p>
      )}
    </div>
  );
}
