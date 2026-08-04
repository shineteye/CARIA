export default function OnboardingProgress({ onboarding, phase }) {
  if (phase !== 'onboarding' || !onboarding) return null;

  const step = onboarding.step || 1;
  const total = onboarding.total || 12;
  const progress =
    typeof onboarding.progress === 'number'
      ? onboarding.progress
      : Math.round(((step - 1) / total) * 100);

  return (
    <div className="px-6 py-3 border-b border-border bg-gradient-to-r from-navy/[0.03] to-gold/[0.06]">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-fg-muted">
            Getting to know you
          </p>
          <p className="text-sm font-semibold text-navy mt-0.5">
            Question {Math.min(step, total)} of {total}
          </p>
        </div>
        <span className="text-xs font-semibold text-navy bg-white border border-border rounded-full px-2.5 py-1">
          {Math.min(progress, 99)}%
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-border">
        <div
          className="h-full rounded-full bg-gold transition-all duration-500 ease-out"
          style={{ width: `${Math.min(Math.max(progress, 4), 99)}%` }}
        />
      </div>
      {onboarding.question?.helper && (
        <p className="text-[12px] text-fg-muted mt-2 leading-snug">
          {onboarding.question.helper}
        </p>
      )}
    </div>
  );
}
