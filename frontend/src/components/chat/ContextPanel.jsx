import { useEffect, useState } from 'react';
import { getCareerRecommendations } from '../../services/api';

/* Fields worth surfacing live during onboarding, in the order they're asked. */
const LEARNED_FIELDS = [
  { key: 'educationLevel', label: 'Stage' },
  { key: 'region', label: 'Region' },
  { key: 'strengths', label: 'Strong in', list: true },
  { key: 'challenges', label: 'Struggles with', list: true },
  { key: 'interests', label: 'Drawn to', list: true },
  { key: 'careerDirection', label: 'Direction' },
  { key: 'influences', label: 'Influenced by' },
  { key: 'familyExpectations', label: 'Family' },
  { key: 'financialSituation', label: 'Finances' },
  { key: 'mobility', label: 'Mobility' },
  { key: 'timeline', label: 'Next step' },
  { key: 'motivation', label: 'Values most' },
];

function formatValue(value, list) {
  if (list && Array.isArray(value)) return value.length ? value.join(', ') : null;
  if (value == null || value === '') return null;
  return String(value);
}

/* ── The answers themselves, shared by both phases ──
   Onboarding builds this list live; after the guide it stays as the record of
   what the advice is actually based on. Hiding it the moment onboarding ends
   made the chat feel like it had forgotten twelve questions of work. */

function LearnedList({ profile, collapsible = false }) {
  const [expanded, setExpanded] = useState(false);

  const learned = LEARNED_FIELDS.map(({ key, label, list }) => {
    const value = formatValue(profile?.[key], list);
    return value ? { label, value } : null;
  }).filter(Boolean);

  if (learned.length === 0) {
    return (
      <p className="text-[13px] text-fg-muted leading-relaxed">
        Your answers will collect here as we talk.
      </p>
    );
  }

  // After onboarding the full twelve would crowd out the roadmap, so show the
  // first few and let them open the rest.
  const PREVIEW = 4;
  const hidden = collapsible && !expanded ? learned.length - PREVIEW : 0;
  const shown = hidden > 0 ? learned.slice(0, PREVIEW) : learned;

  return (
    <>
      <dl className="flex flex-col">
        {shown.map(({ label, value }, i) => (
          <div
            key={label}
            className={`py-2.5 ${i !== 0 ? 'border-t border-border' : 'pt-0'}`}
          >
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted mb-0.5">
              {label}
            </dt>
            <dd className="text-[13px] text-navy leading-snug">{value}</dd>
          </div>
        ))}
      </dl>

      {collapsible && learned.length > PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-[12px] font-medium text-gold hover:text-navy transition-colors"
        >
          {hidden > 0 ? `Show ${hidden} more` : 'Show less'}
        </button>
      )}
    </>
  );
}

/* ── Onboarding: progress + what Caria has learned so far ── */

function OnboardingPanel({ onboarding, profile }) {
  const step = onboarding?.step || 1;
  const total = onboarding?.total || 12;
  const progress = Math.min(
    Math.max(
      typeof onboarding?.progress === 'number'
        ? onboarding.progress
        : Math.round(((step - 1) / total) * 100),
      4,
    ),
    99,
  );

  return (
    <>
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-muted">
            Progress
          </p>
          <span className="text-[11px] font-semibold text-navy tabular-nums">
            {step} / {total}
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-border">
          <div
            className="h-full rounded-full bg-gold transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </section>

      <section>
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-muted mb-3">
          What I've learned
        </p>
        <LearnedList profile={profile} />
      </section>
    </>
  );
}

/* ── After the guide: goal, roadmap, top scored matches ── */

function RoadmapPanel({ stages, roadmapMeta }) {
  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-muted mb-3">
        Your roadmap
      </p>
      <div className="flex flex-col">
        {roadmapMeta.map(({ key, label }, idx) => {
          const stage = stages.find((s) => s.name === key) || { status: 'locked' };
          const isActive = stage.status === 'active';
          const isComplete = stage.status === 'complete';
          const isLast = idx === roadmapMeta.length - 1;

          return (
            <div key={key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${
                    isActive
                      ? 'bg-navy ring-4 ring-navy/10'
                      : isComplete
                        ? 'bg-gold'
                        : 'bg-border'
                  }`}
                />
                {!isLast && (
                  <span
                    className={`w-px flex-1 my-1 ${isComplete ? 'bg-gold' : 'bg-border'}`}
                    style={{ minHeight: 22 }}
                  />
                )}
              </div>
              <div className="pb-3.5 min-w-0">
                <p
                  className={`text-[13px] font-medium leading-tight ${
                    isActive ? 'text-navy' : isComplete ? 'text-fg' : 'text-fg-muted'
                  }`}
                >
                  {label}
                </p>
                {stage.detail && stage.status !== 'locked' && (
                  <p className="text-[11px] mt-0.5 text-gold leading-snug">
                    {stage.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TopMatches() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getCareerRecommendations()
      .then(({ recommendations }) => {
        if (!cancelled) setMatches((recommendations || []).slice(0, 3));
      })
      .catch(() => {
        /* panel simply stays hidden if unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!matches.length) return null;

  return (
    <section>
      <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-muted mb-3">
        Your top matches
      </p>
      <div className="flex flex-col gap-2.5">
        {matches.map((m) => (
          <div key={m.careerId}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-[13px] text-navy truncate">{m.title}</span>
              <span className="text-[11px] font-semibold text-navy tabular-nums shrink-0">
                {m.overallScore}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full bg-navy"
                style={{ width: `${m.overallScore}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ContextPanel({
  phase,
  onboarding,
  profile,
  careerGoal,
  guideReady,
  stages,
  roadmapMeta,
  onEditProfile,
}) {
  const isOnboarding = phase === 'onboarding';

  return (
    <div className="flex flex-col gap-7 p-6">
      {/* Goal header — always present, adapts to phase */}
      <section>
        <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-muted mb-2">
          {isOnboarding ? 'Getting to know you' : 'Working toward'}
        </p>
        <h2
          className="text-lg text-navy leading-snug"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {careerGoal || (isOnboarding ? 'Building your profile…' : 'No goal set yet')}
        </h2>
        {!isOnboarding && onEditProfile && (
          <button
            type="button"
            onClick={onEditProfile}
            className="mt-2 text-[12px] font-medium text-gold hover:text-navy transition-colors"
          >
            Edit my answers
          </button>
        )}
      </section>

      {isOnboarding ? (
        <OnboardingPanel onboarding={onboarding} profile={profile} />
      ) : (
        <>
          <RoadmapPanel stages={stages} roadmapMeta={roadmapMeta} />
          {guideReady && <TopMatches />}

          {/* The answers stay visible after the guide: this is what every
              recommendation in the conversation is built on. */}
          <section>
            <p className="text-[10px] font-semibold tracking-[0.12em] uppercase text-fg-muted mb-3">
              What I know about you
            </p>
            <LearnedList profile={profile} collapsible />
          </section>
        </>
      )}
    </div>
  );
}
