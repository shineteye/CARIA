import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCareerRecommendations } from '../../services/api';
import { fitLabel } from '../../lib/stage';

const ANSWER_FIELDS = [
  { key: 'educationLevel', label: 'Stage' },
  { key: 'region', label: 'Region' },
  { key: 'strengths', label: 'Strong in' },
  { key: 'challenges', label: 'Struggles with' },
  { key: 'interests', label: 'Drawn to' },
  { key: 'careerDirection', label: 'Direction' },
  { key: 'influences', label: 'Influenced by' },
  { key: 'familyExpectations', label: 'Family' },
  { key: 'financialSituation', label: 'Finances' },
  { key: 'mobility', label: 'Mobility' },
  { key: 'timeline', label: 'Next step' },
  { key: 'motivation', label: 'Values most' },
];

function RailHeading({ children, action }) {
  return (
    <div className="flex items-baseline justify-between gap-2 mb-3">
      <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-fg-muted">
        {children}
      </p>
      {action}
    </div>
  );
}

function Milestones({ stage }) {
  return (
    <ol className="flex flex-col">
      {stage.milestones.map((m, i) => {
        const done = i < stage.current;
        const now = i === stage.current;
        const last = i === stage.milestones.length - 1;
        return (
          <li key={m.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-semibold ${
                  done
                    ? 'bg-gold text-navy'
                    : now
                      ? 'bg-navy text-white ring-4 ring-navy/10'
                      : 'bg-white border border-border text-fg-muted'
                }`}
                aria-label={done ? 'Done' : now ? 'Current' : 'Upcoming'}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12l5 5 9-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              {!last && (
                <span className={`w-px flex-1 my-1 ${done ? 'bg-gold' : 'bg-border'}`} style={{ minHeight: 16 }} />
              )}
            </div>
            <div className="pb-3.5 min-w-0">
              <p
                className={`text-[13px] leading-tight ${
                  now ? 'text-navy font-semibold' : done ? 'text-fg-soft' : 'text-fg-muted'
                }`}
              >
                {m.title}
                {now && (
                  <span className="ml-2 text-[9px] font-semibold uppercase tracking-wider text-gold align-middle">
                    Now
                  </span>
                )}
              </p>
              {!done && <p className="text-[11px] mt-0.5 text-fg-muted leading-snug">{m.detail}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BestFits() {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getCareerRecommendations()
      .then(({ recommendations }) => {
        if (!cancelled) setMatches((recommendations || []).slice(0, 3));
      })
      .catch(() => {
        /* the section simply stays hidden if unavailable */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!matches.length) return null;

  return (
    <section>
      <RailHeading
        action={
          <Link to="/explore" className="text-[11px] font-medium text-gold hover:text-navy">
            All careers →
          </Link>
        }
      >
        Best fits
      </RailHeading>
      <ul className="flex flex-col gap-2">
        {matches.map((m) => (
          <li key={m.careerId} className="rounded-xl bg-white border border-border px-3.5 py-2.5">
            <p className="text-[13px] text-navy font-medium leading-snug">{m.title}</p>
            <p className="text-[11px] text-fg-muted mt-0.5">
              {fitLabel(m.overallScore)} · {m.demand} demand
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Answers({ profile, onEdit }) {
  const [open, setOpen] = useState(false);
  const rows = ANSWER_FIELDS.map(({ key, label }) => {
    const v = profile?.[key];
    const value = Array.isArray(v) ? v.join(', ') : v;
    return value ? { label, value } : null;
  }).filter(Boolean);

  if (!rows.length) return null;
  const shown = open ? rows : rows.slice(0, 3);

  return (
    <section>
      <RailHeading
        action={
          onEdit && (
            <button type="button" onClick={onEdit} className="text-[11px] font-medium text-gold hover:text-navy">
              Edit
            </button>
          )
        }
      >
        Based on your answers
      </RailHeading>
      <dl className="flex flex-col">
        {shown.map(({ label, value }, i) => (
          <div key={label} className={`py-2 ${i ? 'border-t border-border' : 'pt-0'}`}>
            <dt className="text-[10px] font-semibold uppercase tracking-wide text-fg-muted">{label}</dt>
            <dd className="text-[13px] text-navy leading-snug">{value}</dd>
          </div>
        ))}
      </dl>
      {rows.length > 3 && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-1.5 text-[12px] font-medium text-gold hover:text-navy"
        >
          {open ? 'Show less' : `Show all ${rows.length}`}
        </button>
      )}
    </section>
  );
}

/** The student's standing on the path — the frame every answer is given in. */
export default function PlanRail({ stage, profile, careerGoal, onEditProfile }) {
  return (
    <div className="flex flex-col gap-7 p-6">
      <section>
        <RailHeading>Your position</RailHeading>
        <p className="text-[17px] text-navy leading-snug" style={{ fontFamily: 'var(--font-display)' }}>
          {stage.label}
          {profile?.region ? <span className="text-fg-muted"> · {profile.region}</span> : null}
        </p>
        {careerGoal && (
          <p className="text-[12px] text-fg-soft mt-1">
            Working toward <span className="text-navy font-medium">{careerGoal}</span>
          </p>
        )}
      </section>

      <section>
        <RailHeading>Milestones</RailHeading>
        <Milestones stage={stage} />
      </section>

      <BestFits />
      <Answers profile={profile} onEdit={onEditProfile} />
    </div>
  );
}
