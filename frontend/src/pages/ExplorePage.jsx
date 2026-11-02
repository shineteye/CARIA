import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { useAuth } from '../context/AuthContext';
import { getCareerRecommendations, getAllCareers } from '../services/api';
import { stageInfo, fitLabel } from '../lib/stage';

/* ─── Data ──────────────────────────────────────────────── */

/**
 * Categories are driven by each career's own tags, not by parsing its SHS stream.
 * Stream-parsing mis-filed careers badly — a teacher whose stream is "any subject
 * matching your specialism" landed under Engineering & Tech, and 56 of 107 careers
 * fell into Science & Health because the word "science" appeared anywhere.
 * Order matters: the first matching tag wins, so specific fields beat broad ones.
 */
const CATEGORY_RULES = [
  ['Health & Medicine', ['health']],
  ['Teaching & Education', ['teaching']],
  ['Engineering & Building', ['building']],
  ['Tech & Digital', ['tech']],
  ['Business & Finance', ['business']],
  ['Law & Public Service', ['justice']],
  ['Creative & Media', ['creative_work']],
  ['Trades & Practical', ['practical']],
  ['Science & Research', ['science']],
];

const CATEGORIES = ['All', ...CATEGORY_RULES.map(([label]) => label)];

/**
 * The FIRST tag on a career is its primary field; later tags are secondary
 * flavour (a hotel manager carries "teaching" for the mentoring side of the job,
 * but filing it under Teaching & Education would mislead someone browsing for
 * a classroom career). So match on the primary tag first, and only fall back to
 * a secondary match if the primary doesn't map to any category.
 */
function categoryFor(tags, shsStream) {
  const primary = (tags || [])[0];
  if (primary) {
    const direct = CATEGORY_RULES.find(([, needed]) => needed.includes(primary));
    if (direct) return direct[0];
  }
  const owned = new Set(tags || []);
  for (const [label, needed] of CATEGORY_RULES) {
    if (needed.some((t) => owned.has(t))) return label;
  }
  const s = (shsStream || '').toLowerCase();
  if (s.includes('technical') || s.includes('tvet')) return 'Trades & Practical';
  if (s.includes('business')) return 'Business & Finance';
  if (s.includes('arts')) return 'Creative & Media';
  if (s.includes('science')) return 'Health & Medicine';
  return 'Science & Research';
}

const ICON_FROM_CATEGORY = {
  'Health & Medicine': IconHealth,
  'Teaching & Education': IconBook,
  'Engineering & Building': IconBlueprint,
  'Tech & Digital': IconCode,
  'Business & Finance': IconBank,
  'Law & Public Service': IconScales,
  'Creative & Media': IconPalette,
  'Trades & Practical': IconWrench,
  'Science & Research': IconFlask,
};

const SORTS = {
  fit: { label: 'Best fit', fn: (a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0) },
  pay: { label: 'Highest pay', fn: (a, b) => (b.salaryMid ?? 0) - (a.salaryMid ?? 0) },
  demand: { label: 'Job demand', fn: (a, b) => DEMAND_RANK[b.demand] - DEMAND_RANK[a.demand] },
  az: { label: 'A–Z', fn: (a, b) => a.title.localeCompare(b.title) },
};
const DEMAND_RANK = { high: 3, medium: 2, low: 1 };

/** Cards shown per page — the catalogue is 100+. */
const PAGE_SIZE = 18;

function salaryMid(range) {
  const nums = String(range || '').replace(/,/g, '').match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : null;
}

function toCareer(rec, personalized) {
  const category = categoryFor(rec.tags, rec.shsStream);
  const programmes = (rec.universities || []).map((u) => ({
    institution: u.institution,
    program: u.program,
    cutoff: typeof u.cutoff === 'number' ? u.cutoff : null,
  }));
  return {
    id: rec.careerId,
    title: rec.title,
    category,
    Icon: ICON_FROM_CATEGORY[category] || IconBlueprint,
    shsStream: rec.shsStream || null,
    shsCategories: rec.shsCategories || [],
    electives: rec.electives || [],
    beceTarget: rec.beceTarget || null,
    programmes,
    firstProgramme: programmes[0]?.program || null,
    alternatives: rec.alternatives || [],
    salaryRange: rec.salaryRange,
    salaryMid: salaryMid(rec.salaryRange),
    tuitionTier: rec.tuitionTier,
    demand: rec.demand,
    overallScore: personalized ? rec.overallScore : undefined,
    fitScore: personalized ? rec.fitScore : undefined,
    moneyScore: personalized ? rec.moneyScore : undefined,
  };
}

/* ─── Page ──────────────────────────────────────────────── */

export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [careers, setCareers] = useState([]);
  const [profile, setProfile] = useState(null);
  const [personalized, setPersonalized] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [reloadKey, setReloadKey] = useState(0);

  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('fit');
  const [cost, setCost] = useState('any');
  const [highDemand, setHighDemand] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);
  const [compareIds, setCompareIds] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    // Signed in → the full catalogue ranked for them. Logged out → the same
    // catalogue, ranked neutrally. There is no static fallback: a sample with
    // made-up cut-offs is worse than an honest error.
    const request = isAuthenticated
      ? getCareerRecommendations().then((d) => ({ list: d.recommendations, profile: d.profile, personal: true }))
      : getAllCareers().then((d) => ({ list: d.careers, profile: null, personal: false }));

    request
      .then(({ list, profile: p, personal }) => {
        if (cancelled) return;
        const hasProfile = personal && !!(p?.interests?.length || p?.strengths?.length);
        setCareers((list || []).map((r) => toCareer(r, hasProfile)));
        setProfile(p);
        setPersonalized(hasProfile);
        setSort(hasProfile ? 'fit' : 'az');
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadKey]);

  const stage = stageInfo(profile?.educationLevel);

  const counts = useMemo(() => {
    const c = { All: careers.length };
    CATEGORIES.slice(1).forEach((k) => {
      c[k] = careers.filter((x) => x.category === k).length;
    });
    return c;
  }, [careers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return careers
      .filter((c) => category === 'All' || c.category === category)
      .filter((c) => cost === 'any' || c.tuitionTier === cost)
      .filter((c) => !highDemand || c.demand === 'high')
      .filter(
        (c) =>
          !q ||
          c.title.toLowerCase().includes(q) ||
          (c.shsStream || '').toLowerCase().includes(q) ||
          c.programmes.some((p) => p.program.toLowerCase().includes(q)),
      )
      .sort(SORTS[sort].fn);
  }, [careers, category, cost, highDemand, search, sort]);

  const topFits = personalized ? [...careers].sort(SORTS.fit.fn).slice(0, 3) : [];
  const visible = filtered.slice(0, visibleCount);
  const resetPaging = () => setVisibleCount(PAGE_SIZE);

  const toggleCompare = (id) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cream" style={{ fontFamily: 'var(--font-body)' }}>
      <AppHeader variant="cream" />

      <main className="flex-1 overflow-y-auto">
        {/* ════ Masthead ════ */}
        <section className="bg-navy text-white">
          <div className="max-w-[1180px] mx-auto px-4 sm:px-6 md:px-8 pt-10 pb-8">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gold-light mb-2">
              Career directory
            </p>
            <h1 className="text-[2rem] sm:text-[2.4rem] leading-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
              {personalized ? 'Careers ranked for you' : 'Explore careers in Ghana'}
            </h1>
            <p className="text-[14px] text-white/70 max-w-[60ch] mb-6">
              {personalized
                ? `Ranked against your strengths, interests, finances and what you value. Each route starts from where you are now: ${stage.label}.`
                : 'Every career with the SHS stream, electives and university programmes that lead to it. Cut-offs are shown only where we hold a published figure.'}
            </p>
            <div className="relative max-w-[560px]">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted">
                <IconSearch />
              </span>
              <input
                type="search"
                placeholder="Search a career, stream or programme…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPaging();
                }}
                className="w-full pl-11 pr-4 py-3 rounded-full bg-white text-[15px] text-fg outline-none focus:ring-4 focus:ring-gold/30"
              />
            </div>
            {!isAuthenticated && (
              <p className="text-[12px] text-white/60 mt-3">
                <Link to="/register" className="text-gold-light underline underline-offset-2 hover:text-white">
                  Create an account
                </Link>{' '}
                and answer twelve questions to see these ranked for you.
              </p>
            )}
          </div>
        </section>

        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 md:px-8 py-8">
          {status === 'error' ? (
            <div className="rounded-2xl border border-border bg-white px-6 py-12 text-center">
              <h2 className="text-lg text-navy font-semibold mb-1">Couldn’t load the career directory</h2>
              <p className="text-[14px] text-fg-soft mb-5">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="px-6 py-2.5 rounded-full bg-navy text-white text-[14px] font-semibold hover:bg-navy-light"
              >
                Try again
              </button>
            </div>
          ) : (
            <>
              {/* ════ Best fits ════ */}
              {topFits.length > 0 && !search && category === 'All' && (
                <section className="mb-10">
                  <SectionHeading>Your best fits</SectionHeading>
                  <div className="grid md:grid-cols-3 gap-4">
                    {topFits.map((c, i) => (
                      <FeaturedCard key={c.id} career={c} rank={i + 1} onOpen={() => setSelected(c)} />
                    ))}
                  </div>
                </section>
              )}

              {/* ════ Toolbar ════ */}
              <section className="mb-5">
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {CATEGORIES.map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setCategory(k);
                        resetPaging();
                      }}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-[13px] border transition-colors whitespace-nowrap ${
                        category === k
                          ? 'bg-navy text-white border-navy'
                          : 'bg-white text-fg-soft border-border hover:border-navy hover:text-navy'
                      }`}
                    >
                      {k}
                      <span className={`ml-1.5 text-[11px] ${category === k ? 'text-white/60' : 'text-fg-muted'}`}>
                        {counts[k] ?? 0}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 mt-3">
                  <label className="flex items-center gap-2 text-[13px] text-fg-soft">
                    Sort
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="text-[13px] text-navy bg-white border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-navy"
                    >
                      {Object.entries(SORTS)
                        .filter(([k]) => personalized || k !== 'fit')
                        .map(([k, { label }]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-fg-soft">
                    Study cost
                    <select
                      value={cost}
                      onChange={(e) => {
                        setCost(e.target.value);
                        resetPaging();
                      }}
                      className="text-[13px] text-navy bg-white border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-navy"
                    >
                      <option value="any">Any</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 text-[13px] text-fg-soft cursor-pointer">
                    <input
                      type="checkbox"
                      checked={highDemand}
                      onChange={(e) => {
                        setHighDemand(e.target.checked);
                        resetPaging();
                      }}
                      className="w-4 h-4 accent-navy"
                    />
                    High demand only
                  </label>
                  <span className="text-[12px] text-fg-muted sm:ml-auto">
                    {status === 'loading' ? 'Loading…' : `${filtered.length} career${filtered.length === 1 ? '' : 's'}`}
                  </span>
                </div>
              </section>

              {/* ════ Directory ════ */}
              {status === 'loading' ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="h-[132px] bg-white rounded-2xl border border-border animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {visible.map((c) => (
                    <CareerRow
                      key={c.id}
                      career={c}
                      onOpen={() => setSelected(c)}
                      comparable={personalized}
                      checked={compareIds.includes(c.id)}
                      onToggleCompare={() => toggleCompare(c.id)}
                    />
                  ))}
                  {visible.length === 0 && (
                    <p className="col-span-full text-center text-fg-muted py-16 text-sm">
                      No careers match these filters.
                    </p>
                  )}
                </div>
              )}

              {visibleCount < filtered.length && status === 'ready' && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    className="px-8 py-2.5 rounded-full border border-navy text-navy text-sm font-medium hover:bg-navy hover:text-white transition-colors"
                  >
                    Show more ({filtered.length - visibleCount} left)
                  </button>
                </div>
              )}

              <p className="text-[11px] text-fg-muted text-center mt-10 max-w-[70ch] mx-auto">
                Salary ranges are estimates, not survey data. University cut-offs appear only where we hold a published
                figure; confirm every requirement with the institution before applying.
              </p>
            </>
          )}
        </div>
      </main>

      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-navy text-white rounded-full shadow-xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{compareIds.length} selected</span>
          <Link
            to={`/compare?ids=${compareIds.join(',')}`}
            className="text-sm font-semibold bg-gold text-navy px-4 py-1.5 rounded-full hover:bg-white transition-colors"
          >
            Compare →
          </Link>
          <button onClick={() => setCompareIds([])} className="text-white/60 hover:text-white text-sm">
            Clear
          </button>
        </div>
      )}

      {selected && (
        <CareerDetail career={selected} stage={stage} personalized={personalized} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ─── Pieces ────────────────────────────────────────────── */

function SectionHeading({ children }) {
  return (
    <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-fg-muted mb-3">{children}</p>
  );
}

const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : "");

function Meta({ children }) {
  return (
    <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-cream text-fg-soft">
      {children}
    </span>
  );
}

function FeaturedCard({ career, rank, onOpen }) {
  const { title, category, Icon, shsStream, firstProgramme, overallScore, salaryRange, demand } = career;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left bg-white rounded-2xl border border-border p-5 hover:border-navy hover:shadow-md transition-all flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <span className="w-10 h-10 rounded-xl bg-navy/5 flex items-center justify-center">
          <Icon />
        </span>
        <span className="text-[11px] font-semibold text-navy bg-gold-faint border border-gold/25 px-2.5 py-1 rounded-full">
          #{rank} · {fitLabel(overallScore)}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold mb-1">{category}</p>
      <h3 className="text-lg font-semibold text-navy leading-snug mb-2">{title}</h3>
      <p className="text-[13px] text-fg-soft leading-relaxed flex-1">
        {[shsStream?.replace(/ \(.*\)$/, ''), firstProgramme].filter(Boolean).join(' → ') || 'Route varies'}
      </p>
      <div className="flex flex-wrap gap-1.5 mt-4">
        <Meta>{cap(demand)} demand</Meta>
        {salaryRange && salaryRange !== 'Not enough data' && <Meta>{salaryRange}</Meta>}
      </div>
    </button>
  );
}

function CareerRow({ career, onOpen, comparable, checked, onToggleCompare }) {
  const { title, category, Icon, shsStream, firstProgramme, overallScore, demand, tuitionTier } = career;
  const fit = fitLabel(overallScore);

  return (
    <div className="group relative bg-white rounded-2xl border border-border hover:border-navy transition-colors">
      <button type="button" onClick={onOpen} className="w-full text-left p-4 flex gap-3.5">
        <span className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">{category}</span>
          <span className="block text-[15px] font-semibold text-navy leading-snug pr-16">{title}</span>
          <span className="block text-[12px] text-fg-muted mt-1 truncate">
            {[shsStream?.replace(/ \(.*\)$/, ''), firstProgramme].filter(Boolean).join(' → ') || 'Route varies'}
          </span>
          <span className="flex flex-wrap gap-1.5 mt-2.5">
            {fit && <Meta>{fit}</Meta>}
            <Meta>{cap(demand)} demand</Meta>
            <Meta>{cap(tuitionTier)} study cost</Meta>
          </span>
        </span>
      </button>
      {comparable && (
        <label className="absolute top-3.5 right-3.5 flex items-center gap-1.5 cursor-pointer text-[11px] text-fg-muted hover:text-navy">
          <input type="checkbox" checked={checked} onChange={onToggleCompare} className="w-3.5 h-3.5 accent-navy" />
          Compare
        </label>
      )}
    </div>
  );
}

/* ─── Career detail ─────────────────────────────────────── */

/**
 * The route is told from the student's own stage: someone who has finished
 * WASSCE sees electives and programmes, not BECE and SHS selection.
 */
function routeSteps(career, stageKey) {
  const electives = career.electives.length ? career.electives.join(', ') : null;
  const stream = career.shsStream?.replace(/ \(.*\)$/, '');
  const school = [
    {
      step: 'BECE',
      title: 'Strengthen the subjects this path depends on',
      body: career.beceTarget
        ? `Students on this path typically aim for a BECE aggregate of ${career.beceTarget}. This is planning guidance for the career, not an SHS cut-off — Ghana has no fixed SHS cut-off points.`
        : 'Focus on Core Maths, English and Integrated Science.',
    },
    {
      step: 'SHS',
      title: stream ? `${stream} programme` : 'SHS programme',
      body: career.shsCategories.length
        ? `Commonly pursued at Category ${career.shsCategories.join('/')} schools. Categories reflect past results, not entry aggregates.`
        : 'Ask the advisor which schools offer this programme in your region.',
    },
  ];
  const wassce = {
    step: 'WASSCE',
    title: electives ? `Electives: ${electives}` : 'Elective subjects',
    body: 'Credit passes (A1–C6) in Core English and Core Maths are needed for almost every programme.',
  };
  const uni = {
    step: 'Uni',
    title: 'Programme admission',
    body: 'Compare your aggregate with the programmes below — published cut-offs are marked.',
  };

  if (stageKey === 'post_wassce') {
    return [
      { ...wassce, title: electives ? `Check your grades in ${electives}` : 'Check your elective grades', body: 'Your best six subjects form your aggregate. Core English and Core Maths credits are required for almost every programme.' },
      uni,
    ];
  }
  if (stageKey === 'shs' || stageKey === 'shs_final') return [wassce, uni];
  return [...school, wassce, uni];
}

function CareerDetail({ career, stage, personalized, onClose }) {
  const { title, category, Icon, programmes, alternatives } = career;
  const steps = routeSteps(career, stage.key);
  const showConditions = !stage.key || stage.key === 'jhs' || stage.key === 'exploring';
  const askHref = `/chat?ask=${encodeURIComponent(`Is ${title} a realistic path for me from where I am now?`)}`;

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-[2px] z-40" onClick={onClose} />
      <aside
        role="dialog"
        aria-label={title}
        className="fixed top-0 right-0 h-full w-full max-w-[560px] bg-cream z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        <header className="bg-navy text-white px-6 pt-6 pb-5 shrink-0">
          <div className="flex items-start gap-4">
            <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center shrink-0">
              <Icon size={22} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gold-light mb-1">{category}</p>
              <h2 className="text-2xl leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                {title}
              </h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-white/60 hover:text-white p-1 shrink-0">
              <IconClose />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {personalized && <HeaderChip>{fitLabel(career.overallScore)}</HeaderChip>}
            <HeaderChip>{cap(career.demand)} demand</HeaderChip>
            <HeaderChip>{cap(career.tuitionTier)} study cost</HeaderChip>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
          {personalized && (
            <section>
              <SectionHeading>Why it ranks here for you</SectionHeading>
              <div className="bg-white border border-border rounded-2xl p-4 grid grid-cols-2 gap-4">
                <FitFactor label="Interests & strengths" value={career.fitScore} />
                <FitFactor label="Pay, demand & cost" value={career.moneyScore} />
              </div>
            </section>
          )}

          <section>
            <SectionHeading>
              {stage.key ? `Your route from here · ${stage.label}` : 'The route'}
            </SectionHeading>
            <ol className="bg-white border border-border rounded-2xl p-5">
              {steps.map((s, i) => (
                <li key={s.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span className="w-7 h-7 rounded-full bg-navy text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {i < steps.length - 1 && <span className="w-px flex-1 my-1 bg-border" style={{ minHeight: 20 }} />}
                  </div>
                  <div className="pb-5 min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold mb-0.5">
                      {s.step === 'Uni' ? 'University' : s.step}
                    </p>
                    <p className="text-[14px] font-semibold text-navy mb-0.5">{s.title}</p>
                    <p className="text-[13px] text-fg-soft leading-relaxed">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {programmes.length > 0 && (
            <section>
              <SectionHeading>University programmes</SectionHeading>
              <ul className="bg-white border border-border rounded-2xl divide-y divide-border">
                {programmes.map((p) => (
                  <li key={`${p.institution}-${p.program}`} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[14px] text-navy font-medium leading-snug">{p.program}</p>
                      <p className="text-[12px] text-fg-muted">{p.institution}</p>
                    </div>
                    {p.cutoff !== null ? (
                      <span className="shrink-0 text-right">
                        <span className="block text-[15px] font-semibold text-navy tabular-nums">{p.cutoff}</span>
                        <span className="block text-[10px] uppercase tracking-wide text-fg-muted">Published cut-off</span>
                      </span>
                    ) : (
                      <span className="shrink-0 text-[11px] text-fg-muted text-right leading-tight">
                        Cut-off not in our data
                        <br />
                        confirm with university
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {alternatives.length > 0 && (
            <section>
              <SectionHeading>Other routes into this field</SectionHeading>
              <div className="flex flex-col gap-2.5">
                {alternatives.map((alt, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 border border-border">
                    {showConditions && alt.condition && (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gold mb-1">{alt.condition}</p>
                    )}
                    {showConditions && alt.stream && <p className="text-[14px] font-medium text-navy mb-1">{alt.stream}</p>}
                    {!showConditions && alt.programmes?.length > 0 && (
                      <p className="text-[14px] font-medium text-navy mb-1">{alt.programmes.join(' · ')}</p>
                    )}
                    <p className="text-[13px] text-fg-soft leading-relaxed">{alt.rationale}</p>
                    {alt.careers?.length > 0 && (
                      <p className="text-[12px] text-fg-muted mt-2">Leads to: {alt.careers.join(' · ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-gold-faint border border-gold/20 rounded-2xl p-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] uppercase text-gold mb-1.5">Earnings (estimate)</p>
            <p className="text-base font-semibold text-navy">{career.salaryRange}</p>
            <p className="text-[12px] text-navy/60 mt-1">Approximate monthly range, entry to mid-career. Not survey data.</p>
          </section>
        </div>

        <footer className="p-5 border-t border-border bg-white shrink-0 flex gap-3">
          <Link
            to={askHref}
            className="flex-1 text-center py-3 rounded-full bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors"
          >
            Ask the advisor about this career
          </Link>
          <button
            onClick={onClose}
            className="px-5 py-3 rounded-full border border-border text-fg-soft text-sm hover:border-navy hover:text-navy transition-colors"
          >
            Close
          </button>
        </footer>
      </aside>
    </>
  );
}

function HeaderChip({ children }) {
  return (
    <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/10 text-white/85">
      {children}
    </span>
  );
}

function FitFactor({ label, value }) {
  const word = value >= 70 ? 'Strong' : value >= 45 ? 'Moderate' : 'Limited';
  return (
    <div>
      <p className="text-[12px] text-fg-muted mb-1">{label}</p>
      <p className="text-[14px] font-semibold text-navy mb-2">{word}</p>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div className="h-full rounded-full bg-navy" style={{ width: `${Math.max(4, value || 0)}%` }} />
      </div>
    </div>
  );
}

/* ─── Icon Components ───────────────────────────────────── */
/* All icons default to the navy brand color for a single cohesive accent. */

function IconHealth({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke={color} strokeWidth="1.8"/>
      <path d="M12 8V16M8 12H16" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconCode({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16 18L22 12L16 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 6L2 12L8 18" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconBank({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 21H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3 10H21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M5 10V21M9 10V21M13 10V21M17 10V21M19 10V21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M12 3L21 10H3L12 3Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function IconWrench({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconScales({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18M3 6l4 8H3l4-8zM17 6l4 8h-8l4-8z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 21h8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconBlueprint({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M12 22V12M2 7l10 5 10-5" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function IconBook({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPalette({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 22a10 10 0 1 1 10-10c0 2-1.5 3-3 3h-2a2 2 0 0 0-1.4 3.4A2 2 0 0 1 14 22h-2z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="7.5" cy="12" r="1.2" fill={color}/>
      <circle cx="10" cy="7.5" r="1.2" fill={color}/>
      <circle cx="15" cy="8" r="1.2" fill={color}/>
    </svg>
  );
}

function IconFlask({ color = '#0d1b3e', size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 3h6M10 3v6.5L4.6 18.4A1.5 1.5 0 0 0 5.9 20.7h12.2a1.5 1.5 0 0 0 1.3-2.3L14 9.5V3" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.5 15h9" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
      <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
