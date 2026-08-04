const FIELDS = [
  { key: "educationLevel", label: "Stage" },
  { key: "region", label: "Region" },
  { key: "strengths", label: "Strengths", list: true },
  { key: "challenges", label: "Challenges", list: true },
  { key: "interests", label: "Interests", list: true },
  { key: "careerDirection", label: "Direction" },
  { key: "influences", label: "Influences" },
  { key: "familyExpectations", label: "Family" },
  { key: "financialSituation", label: "Finances" },
  { key: "mobility", label: "Mobility" },
  { key: "timeline", label: "Timeline" },
  { key: "motivation", label: "Motivation" },
];

function formatValue(value, list) {
  if (list && Array.isArray(value)) {
    if (!value.length) return null;
    return value.join(", ");
  }
  if (value == null || value === "") return null;
  return String(value);
}

export default function ProfileSummary({
  profile,
  phase,
  guideReady,
  onEdit,
}) {
  if (!profile) {
    return (
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-fg-muted leading-relaxed">
          Answer the onboarding questions and your profile will appear here.
        </p>
      </div>
    );
  }

  const rows = FIELDS.map(({ key, label, list }) => {
    const value = formatValue(profile[key], list);
    return value ? { label, value } : null;
  }).filter(Boolean);

  if (!rows.length) {
    return (
      <div className="bg-white border border-border rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-fg-muted leading-relaxed">
          {phase === "onboarding"
            ? "Building your profile as you answer…"
            : "No profile details yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-border rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm">
      <div className="flex items-center justify-between mb-1 gap-2">
        <p className="text-[11px] font-semibold text-navy">Student profile</p>
        <div className="flex items-center gap-2">
          {guideReady && (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Guide ready
            </span>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="text-[11px] font-semibold text-gold hover:text-navy transition-colors"
            >
              Edit
            </button>
          )}
        </div>
      </div>
      {rows.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">
            {label}
          </span>
          <span className="text-[13px] text-navy leading-snug">{value}</span>
        </div>
      ))}
    </div>
  );
}
