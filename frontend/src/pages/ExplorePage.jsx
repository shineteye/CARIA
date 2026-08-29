import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { useAuth } from '../context/AuthContext';
import { getCareerRecommendations, getAllCareers } from '../services/api';

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

const STREAMS = ['All Streams', ...CATEGORY_RULES.map(([label]) => label)];

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

/** Cards shown per page — the catalogue is 100+, so 6 at a time was tedious. */
const PAGE_SIZE = 12;

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

/** Plain-language reason this career ranked where it did — no scores-as-prose. */
function describeMatch(rec) {
  const cheapest = (rec.universities || [])
    .map((u) => u.cutoff)
    .filter((c) => typeof c === 'number');
  const bestCutoff = cheapest.length ? Math.min(...cheapest) : null;

  const parts = [];
  if (rec.shsStream) parts.push(rec.shsStream.replace(/ \(.*\)$/, ''));
  if (bestCutoff !== null) parts.push(`cutoff from aggregate ${bestCutoff}`);
  else if (rec.beceTarget) parts.push(`BECE ${rec.beceTarget}`);
  return parts.join(' · ');
}

/**
 * Map a scored career from the API into the card/detail shape this page renders.
 * Scores are only carried through when they were computed against a real profile —
 * showing "Match for you 52%" to someone who hasn't told us anything is meaningless.
 */
function mapRecommendation(rec, personalized) {
  const stream = categoryFor(rec.tags, rec.shsStream);
  return {
    id: rec.careerId,
    title: rec.title,
    tag: stream.split(' ')[0],
    description: describeMatch(rec),
    shs: rec.shsStream || 'Varies',
    stream,
    Icon: ICON_FROM_CATEGORY[stream] || IconBlueprint,
    fitScore: personalized ? rec.fitScore : undefined,
    moneyScore: personalized ? rec.moneyScore : undefined,
    overallScore: personalized ? rec.overallScore : undefined,
    detail: {
      about: null,
      bece: rec.beceTarget || 'Varies',
      shsStream: rec.shsStream || 'Varies',
      shsCategories: rec.shsCategories || [],
      electives: rec.electives || [],
      wassce: null,
      universities: (rec.universities || []).map((u) => ({
        name: `${u.institution} — ${u.program}`,
        cutoff: u.cutoff ?? null,
      })),
      jobRoles: [],
      salary: rec.salaryRange,
      tuitionTier: rec.tuitionTier,
      demand: rec.demand,
      alternatives: rec.alternatives || [],
    },
  };
}

const FALLBACK_CAREERS = [
  {
    id: 1,
    title: 'Public Health Nurse',
    tag: 'Health',
    description: 'Providing essential healthcare services and health education within Ghanaian communities.',
    shs: 'General Science',
    stream: 'Health & Medicine',
    Icon: IconHealth,
    detail: {
      about: 'Public Health Nurses work in clinics, hospitals, and communities across Ghana to deliver preventive care, maternal health services, and health education. They are in high demand in both public and private health sectors.',
      bece: '12 – 18',
      shsStream: 'General Science',
      shsCategories: ['A', 'B', 'C'],
      electives: ['Biology', 'Chemistry', 'Elective Mathematics'],
      wassce: '≤ 24',
      universities: [
        { name: 'University of Ghana (UG) — BSc Community Health Nursing', cutoff: 18 },
        { name: 'UCC — BSc Community Health Nursing', cutoff: 18 },
        { name: 'UHAS — BSc Nursing', cutoff: 18 },
        { name: 'UEW — BSc Nursing Education', cutoff: 24 },
      ],
      jobRoles: ['Community Health Nurse', 'Maternal Health Specialist', 'Public Health Officer', 'School Health Nurse'],
      salary: 'GHS 3,500 – 7,000/month (entry to mid-level)',
    },
  },
  {
    id: 2,
    title: 'Software Developer',
    tag: 'Tech',
    description: "Building digital solutions and applications for West Africa's booming tech ecosystem.",
    shs: 'General Science / Elective Maths',
    stream: 'Engineering & Building',
    Icon: IconCode,
    detail: {
      about: "Software Developers design, build, and maintain digital products — apps, websites, and enterprise systems. Ghana's growing tech hub (Silicon Savannah) offers strong local and remote job opportunities.",
      bece: '9 – 15',
      shsStream: 'General Science',
      shsCategories: ['A', 'B', 'C'],
      electives: ['Elective Mathematics', 'Physics', 'Chemistry'],
      wassce: '≤ 24',
      universities: [
        { name: 'KNUST — BSc Computer Science', cutoff: 12 },
        { name: 'UG — BSc Information Technology', cutoff: 14 },
        { name: 'AUCC — BSc Computer Science', cutoff: 18 },
        { name: 'Ashesi University — BSc Computer Science', cutoff: null },
      ],
      jobRoles: ['Frontend Developer', 'Backend Engineer', 'Mobile App Developer', 'Data Analyst', 'DevOps Engineer'],
      salary: 'GHS 4,000 – 15,000+/month (local & remote)',
    },
  },
  {
    id: 3,
    title: 'Chartered Accountant',
    tag: 'Business',
    description: 'Managing financial records and providing strategic tax advice for local and multinational firms.',
    shs: 'Business',
    stream: 'Business & Finance',
    Icon: IconBank,
    detail: {
      about: 'Chartered Accountants (CAs) are licensed financial professionals who audit, advise, and manage accounts for businesses. After a BSc in Accounting, you pursue ICAG (Institute of Chartered Accountants Ghana) certification.',
      bece: '12 – 20',
      shsStream: 'Business',
      shsCategories: ['A', 'B', 'C'],
      electives: ['Financial Accounting', 'Business Management', 'Elective Mathematics'],
      wassce: '≤ 30',
      universities: [
        { name: 'UG — BSc Accounting', cutoff: 20 },
        { name: 'KNUST — BSc Accounting', cutoff: 18 },
        { name: 'UCC — BSc Accounting', cutoff: 22 },
        { name: 'GIMPA — BSc Accounting', cutoff: 24 },
      ],
      jobRoles: ['Financial Auditor', 'Tax Consultant', 'Management Accountant', 'Finance Manager', 'ICAG-Certified CA'],
      salary: 'GHS 4,500 – 12,000/month (mid to senior)',
    },
  },
  {
    id: 4,
    title: 'Automotive Engineer',
    tag: 'TVET',
    description: 'Specializing in the maintenance and design of modern vehicle systems.',
    shs: 'Technical / General Science',
    stream: 'Trades & Practical',
    Icon: IconWrench,
    detail: {
      about: 'Automotive Engineers design, test, and maintain vehicle systems including engines, electronics, and safety features. TVET schools offer excellent technical programmes that lead to both HND and university degrees.',
      bece: '15 – 25',
      shsStream: 'Technical (Automotive)',
      shsCategories: ['B', 'C', 'D'],
      electives: ['Auto Mechanics', 'Technical Drawing', 'Elective Mathematics'],
      wassce: '≤ 36',
      universities: [
        { name: 'KNUST — BSc Mechanical Engineering', cutoff: 12 },
        { name: 'UMaT — BSc Automotive Engineering', cutoff: 18 },
        { name: 'Accra Technical University — HND Automotive Eng.', cutoff: null },
        { name: 'Kumasi Technical University — HND Auto Mechanics', cutoff: null },
      ],
      jobRoles: ['Vehicle Diagnostics Technician', 'Automotive Design Engineer', 'Fleet Manager', 'Auto Electrician'],
      salary: 'GHS 2,500 – 8,000/month',
    },
  },
  {
    id: 5,
    title: 'Corporate Lawyer',
    tag: 'Arts & Law',
    description: 'Navigating the legal complexities of business transactions and commercial law.',
    shs: 'General Arts',
    stream: 'Creative & Media',
    Icon: IconScales,
    detail: {
      about: 'Corporate Lawyers advise businesses on contracts, mergers, compliance, and commercial disputes. You must complete a law degree and be called to the Bar by the Ghana School of Law.',
      bece: '9 – 18',
      shsStream: 'General Arts',
      shsCategories: ['A', 'B'],
      electives: ['Literature in English', 'Government', 'Economics or French'],
      wassce: '≤ 20',
      universities: [
        { name: 'University of Ghana — LLB Law', cutoff: 12 },
        { name: 'KNUST — LLB Law', cutoff: 14 },
        { name: 'UCC — LLB Law', cutoff: 14 },
        { name: 'Ghana School of Law (Bar Call) — after LLB', cutoff: null },
      ],
      jobRoles: ['Corporate Counsel', 'Commercial Litigator', 'Legal Advisor', 'Contract Specialist', 'State Attorney'],
      salary: 'GHS 5,000 – 20,000+/month',
    },
  },
  {
    id: 6,
    title: 'Civil Engineer',
    tag: 'Engineering',
    description: 'Designing and overseeing the construction of critical infrastructure like roads and bridges.',
    shs: 'General Science',
    stream: 'Engineering & Building',
    Icon: IconBlueprint,
    detail: {
      about: 'Civil Engineers plan and oversee the design and construction of roads, bridges, water systems, and buildings. Ghana\'s infrastructure boom makes this a high-demand profession in both public and private sectors.',
      bece: '9 – 15',
      shsStream: 'General Science',
      shsCategories: ['A', 'B'],
      electives: ['Elective Mathematics', 'Physics', 'Chemistry'],
      wassce: '≤ 18',
      universities: [
        { name: 'KNUST — BSc Civil Engineering', cutoff: 10 },
        { name: 'UG — BSc Civil Engineering', cutoff: 12 },
        { name: 'UMaT — BSc Civil Engineering', cutoff: 18 },
        { name: 'Accra Technical University — HND Civil Eng.', cutoff: null },
      ],
      jobRoles: ['Structural Engineer', 'Site Engineer', 'Project Manager', 'Highway Engineer', 'Water Resources Engineer'],
      salary: 'GHS 4,000 – 14,000/month',
    },
  },
  {
    id: 7,
    title: 'Medical Doctor',
    tag: 'Health',
    description: 'Diagnosing and treating patients across a wide range of medical conditions in Ghanaian hospitals.',
    shs: 'General Science',
    stream: 'Health & Medicine',
    Icon: IconHealth,
    detail: {
      about: 'Medical Doctors (MBChB) diagnose and treat illness in hospitals, clinics, and communities. It is one of the most competitive and prestigious paths in Ghana, requiring top BECE grades and strong WASSCE scores.',
      bece: '6 – 9',
      shsStream: 'General Science',
      shsCategories: ['A', 'B'],
      electives: ['Biology', 'Chemistry', 'Physics', 'Elective Mathematics'],
      wassce: '≤ 10',
      universities: [
        { name: 'UG (Legon) — MBChB Medicine', cutoff: 8 },
        { name: 'KNUST — MBChB Medicine', cutoff: 6 },
        { name: 'UCC — MBChB Medicine and Surgery', cutoff: 8 },
        { name: 'UHAS — MBChB Medicine', cutoff: 10 },
      ],
      jobRoles: ['General Practitioner', 'Specialist Physician', 'Surgeon', 'Paediatrician', 'Psychiatrist'],
      salary: 'GHS 8,000 – 25,000+/month (with specialisation)',
    },
  },
  {
    id: 8,
    title: 'Graphic Designer',
    tag: 'Arts & Law',
    description: 'Creating visual concepts and designs for brands, media, and digital products across Ghana.',
    shs: 'Visual Arts / General Arts',
    stream: 'Creative & Media',
    Icon: IconScales,
    detail: {
      about: 'Graphic Designers create logos, layouts, and digital visuals for companies, media houses, and online platforms. The rise of digital marketing in Ghana has made this a thriving creative career.',
      bece: '15 – 25',
      shsStream: 'Visual Arts',
      shsCategories: ['B', 'C'],
      electives: ['Picture Making', 'Graphics Design', 'Ceramics or Textiles'],
      wassce: '≤ 30',
      universities: [
        { name: 'KNUST — BA Fine Art (Graphic Design)', cutoff: 18 },
        { name: 'UG — BA Communication Design', cutoff: 20 },
        { name: 'National Film and Television Institute (NAFTI)', cutoff: null },
        { name: 'GIJ — Diploma in Graphic Communication', cutoff: null },
      ],
      jobRoles: ['Brand Designer', 'UI/UX Designer', 'Art Director', 'Motion Graphics Artist', 'Print Designer'],
      salary: 'GHS 2,000 – 10,000/month (freelance upside)',
    },
  },
];

/* ─── Page ──────────────────────────────────────────────── */

export default function ExplorePage() {
  const { isAuthenticated } = useAuth();
  const [activeStream, setActiveStream] = useState('All Streams');
  const [academicLevel, setAcademicLevel] = useState('Any level');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState(null);
  const [compareIds, setCompareIds] = useState([]);
  const [careers, setCareers] = useState([]);
  const [personalized, setPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    // Signed in → the full catalogue ranked for them. Logged out → the same
    // catalogue, ranked neutrally. Either way it's the real 107, not a sample.
    const request = isAuthenticated
      ? getCareerRecommendations().then((d) => ({
          list: d.recommendations,
          personalized: true,
        }))
      : getAllCareers().then((d) => ({ list: d.careers, personalized: false }));

    request
      .then(({ list, personalized: isPersonal }) => {
        if (cancelled) return;
        if (list?.length) {
          setCareers(list.map((r) => mapRecommendation(r, isPersonal)));
          setPersonalized(isPersonal);
        } else {
          setCareers(FALLBACK_CAREERS);
          setPersonalized(false);
        }
      })
      .catch(() => {
        // Backend unreachable — the static sample keeps the page usable.
        if (!cancelled) {
          setCareers(FALLBACK_CAREERS);
          setPersonalized(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const streamCounts = useMemo(() => {
    const counts = { 'All Streams': careers.length };
    STREAMS.slice(1).forEach((s) => {
      counts[s] = careers.filter((c) => c.stream === s).length;
    });
    return counts;
  }, [careers]);

  const filtered = careers.filter((c) => {
    const matchStream = activeStream === 'All Streams' || c.stream === activeStream;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.shs.toLowerCase().includes(q);
    const matchLevel =
      academicLevel === 'Any level' ||
      (academicLevel === 'JHS' && /jhs|bece/i.test(c.shs || '')) ||
      (academicLevel === 'SHS' && !/university/i.test(c.shs || '')) ||
      (academicLevel === 'University' && (c.detail?.universities || []).length > 0);
    return matchStream && matchSearch && matchLevel;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleStream = (s) => {
    setActiveStream(s);
    setVisibleCount(PAGE_SIZE);
  };

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

      <div className="flex flex-1 overflow-hidden">
        {/* ════ Filter Sidebar ════ */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col gap-6 border-r border-border bg-white p-6 overflow-y-auto">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-fg-muted mb-3">
              Search
            </p>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-fg-muted">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="e.g. Nurse, Civil Engineer…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-cream/50 text-sm text-fg outline-none focus:border-navy focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-fg-muted mb-3">
              Streams
            </p>
            <div className="flex flex-col gap-0.5">
              {STREAMS.map((s) => {
                const active = activeStream === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStream(s)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${
                      active ? 'bg-navy text-white' : 'text-fg-soft hover:bg-cream hover:text-navy'
                    }`}
                  >
                    <span>{s}</span>
                    <span className={`text-xs ${active ? 'text-white/60' : 'text-fg-muted'}`}>
                      {streamCounts[s]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-fg-muted mb-3">
              Academic Level
            </p>
            <select
              value={academicLevel}
              onChange={(e) => { setAcademicLevel(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="w-full text-sm text-fg-soft border border-border bg-cream/50 rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-navy"
            >
              <option>Any level</option>
              <option>JHS</option>
              <option>SHS</option>
              <option>University</option>
            </select>
          </div>

          <div className="mt-auto rounded-2xl bg-gold-faint border border-gold/20 p-4">
            <p className="text-[11px] font-semibold text-navy leading-relaxed">
              Not sure which career fits you?
            </p>
            <Link
              to="/chat"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-gold hover:text-navy transition-colors"
            >
              Ask your AI advisor →
            </Link>
          </div>
        </aside>

        {/* ════ Main Content ════ */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="mb-6">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-gold mb-2">
              Career Directory
            </p>
            <h1 className="text-[2rem] text-navy mb-2 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Explore Your Future
            </h1>
            <p className="text-sm text-fg-soft leading-relaxed max-w-130">
              {personalized
                ? 'Ranked for you — weighted by your interests, strengths, and what matters most to you (passion vs pay).'
                : 'Discover career paths tailored for the Ghanaian job market. Select any career to see the full academic roadmap.'}
            </p>
            {!isAuthenticated && (
              <p className="text-xs text-gold mt-2">
                <Link to="/register" className="underline hover:text-navy">Sign up</Link> and complete onboarding to see careers ranked for your own profile.
              </p>
            )}
          </div>

          {/* Mobile-only search + stream pills (sidebar hidden below lg) */}
          <div className="lg:hidden mb-6 space-y-3">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-fg-muted">
                <IconSearch />
              </span>
              <input
                type="text"
                placeholder="Search for careers…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
                className="w-full pl-11 pr-5 py-3 rounded-full border border-border bg-white text-sm text-fg outline-none focus:border-navy transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {STREAMS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStream(s)}
                  className={`shrink-0 text-sm px-4 py-2 rounded-full border transition-all duration-150 whitespace-nowrap ${
                    activeStream === s
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-fg border-border hover:border-navy'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <select
              value={academicLevel}
              onChange={(e) => { setAcademicLevel(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="w-full text-sm text-fg-soft border border-border bg-white rounded-full px-4 py-2.5 outline-none cursor-pointer focus:border-navy"
            >
              <option>Any level</option>
              <option>JHS</option>
              <option>SHS</option>
              <option>University</option>
            </select>
          </div>

          <div className="flex items-baseline justify-between gap-4 mb-4">
            <p className="text-xs text-fg-muted">
              {filtered.length} career{filtered.length === 1 ? '' : 's'}
              {activeStream !== 'All Streams' ? ` in ${activeStream}` : ''}
            </p>
            {personalized && (
              <p className="text-xs text-fg-muted">Sorted by match for you</p>
            )}
          </div>

          {/* Career Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-border p-5 animate-pulse"
                >
                  <div className="w-10 h-10 rounded-xl bg-border/60 mb-4" />
                  <div className="h-2 w-16 rounded bg-border/60 mb-3" />
                  <div className="h-4 w-3/4 rounded bg-border/60 mb-2.5" />
                  <div className="h-3 w-full rounded bg-border/40 mb-1.5" />
                  <div className="h-3 w-2/3 rounded bg-border/40" />
                  <div className="mt-5 pt-4 border-t border-border">
                    <div className="h-1.5 w-full rounded-full bg-border/60" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              {visible.map((career) => (
                <CareerCard
                  key={career.id}
                  career={career}
                  onClick={() => setSelected(career)}
                  comparable={personalized}
                  checked={compareIds.includes(career.id)}
                  onToggleCompare={() => toggleCompare(career.id)}
                />
              ))}
              {visible.length === 0 && (
                <p className="col-span-full text-center text-fg-muted py-16 text-sm">
                  No careers match your search.
                </p>
              )}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pb-4">
              <button
                onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                className="px-10 py-3 rounded-full border border-navy text-navy text-sm font-medium hover:bg-navy hover:text-white transition-all duration-150"
              >
                Load More Careers
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Floating Compare Bar */}
      {compareIds.length >= 2 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-navy text-white rounded-full shadow-xl px-6 py-3 flex items-center gap-4">
          <span className="text-sm font-medium">{compareIds.length} careers selected</span>
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

      {/* Detail Panel */}
      {selected && (
        <CareerDetail career={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ─── Career Card ───────────────────────────────────────── */

function CareerCard({ career, onClick, comparable, checked, onToggleCompare }) {
  const { title, tag, description, shs, Icon, fitScore, moneyScore, overallScore } =
    career;
  const scored = typeof overallScore === 'number';

  return (
    <div className="group bg-white rounded-2xl flex flex-col border border-border hover:border-navy hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 relative">
      {comparable && (
        <label
          className="absolute top-4 right-4 z-10 flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-fg-muted hover:text-navy"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggleCompare}
            className="w-3.5 h-3.5 accent-navy cursor-pointer"
          />
          Compare
        </label>
      )}

      <button onClick={onClick} className="p-5 flex flex-col flex-1 text-left">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-navy/5 mb-4">
          <Icon />
        </div>

        <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gold mb-1.5">
          {tag}
        </span>
        <h3 className="text-lg font-semibold text-navy mb-1.5 leading-snug pr-16">
          {title}
        </h3>
        <p className="text-[13px] text-fg-muted leading-[1.6] flex-1">
          {description || shs}
        </p>

        {scored && (
          <div className="mt-5 pt-4 border-t border-border">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-fg-muted">
                Match for you
              </span>
              <span className="text-[15px] font-semibold text-navy tabular-nums">
                {overallScore}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden mb-2.5">
              <div
                className="h-full rounded-full bg-navy transition-all duration-500"
                style={{ width: `${overallScore}%` }}
              />
            </div>
            <div className="flex gap-4 text-[11px] text-fg-muted">
              <span>
                Interest fit <strong className="text-fg-soft">{fitScore}%</strong>
              </span>
              <span>
                Pay &amp; cost <strong className="text-fg-soft">{moneyScore}%</strong>
              </span>
            </div>
          </div>
        )}

        <span className="text-xs font-medium text-navy opacity-0 group-hover:opacity-100 transition-opacity mt-4">
          View full roadmap →
        </span>
      </button>
    </div>
  );
}

/* ─── Career Detail Slide-Over ──────────────────────────── */

function CareerDetail({ career, onClose }) {
  const { title, tag, Icon, detail } = career;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/40 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-cream z-50 shadow-2xl flex flex-col overflow-hidden border-l border-border"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-white flex items-start gap-4 shrink-0">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-navy/5">
            <Icon size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-gold mb-1 inline-block">
              {tag}
            </span>
            <h2 className="text-xl font-bold text-navy leading-tight">{title}</h2>
          </div>
          <button onClick={onClose} className="text-fg-muted hover:text-navy transition-colors p-1 shrink-0 mt-1">
            <IconClose />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Score breakdown — only for personalized results */}
          {typeof career.overallScore === 'number' && (
            <section className="bg-white border border-border rounded-2xl p-5">
              <div className="flex items-baseline justify-between mb-3">
                <h3 className="text-xs font-semibold tracking-widest uppercase text-fg-muted">
                  Why this ranks here
                </h3>
                <span className="text-lg font-semibold text-navy tabular-nums">
                  {career.overallScore}%
                </span>
              </div>
              <div className="space-y-3">
                <ScoreBar label="Interest &amp; strength fit" value={career.fitScore} />
                <ScoreBar label="Pay, demand &amp; affordability" value={career.moneyScore} />
              </div>
              <p className="text-[12px] text-fg-muted leading-relaxed mt-3.5">
                Weighted by what you told Caria matters most to you.
              </p>
            </section>
          )}

          {/* About (static fallback entries only) */}
          {detail.about && (
            <p className="text-[15px] text-fg-soft leading-[1.7]">{detail.about}</p>
          )}

          {/* Academic Roadmap */}
          <section className="bg-white border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-4">Academic Roadmap</h3>

            <div className="flex flex-col gap-0">
              <RoadmapStep
                step="BECE"
                title={`Aim for aggregate ${detail.bece}`}
                body="Focus on Integrated Science, Core Maths, and English for a strong BECE result."
              />
              <RoadmapStep
                step="SHS"
                title={`${detail.shsStream} Programme`}
                body={
                  [
                    detail.shsCategories?.length
                      ? `Target Category ${detail.shsCategories.join('/')} schools.`
                      : null,
                    detail.electives?.length
                      ? `Electives: ${detail.electives.join(', ')}.`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' ') || 'Ask Caria which electives fit your current results.'
                }
              />
              <RoadmapStep
                step="WASSCE"
                title={
                  detail.wassce
                    ? `Target aggregate ${detail.wassce}`
                    : 'Meet the cutoffs below'
                }
                body="Aim for A1–B3 in all electives. Core subjects: C6 minimum in English, Maths, and Science."
                last
              />
            </div>
          </section>

          {/* Alternative pathways — the "what if I miss it" reassurance */}
          {detail.alternatives?.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-3">
                If you miss that aggregate
              </h3>
              <div className="flex flex-col gap-2.5">
                {detail.alternatives.map((alt) => (
                  <div
                    key={alt.condition}
                    className="bg-white rounded-xl p-4 border border-border"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gold mb-1.5">
                      {alt.condition}
                    </p>
                    <p className="text-sm font-medium text-navy mb-1">{alt.stream}</p>
                    <p className="text-[13px] text-fg-soft leading-relaxed">
                      {alt.rationale}
                    </p>
                    {alt.careers?.length > 0 && (
                      <p className="text-[12px] text-fg-muted mt-2">
                        Leads to: {alt.careers.join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* University Options */}
          <section>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-3">University Options</h3>
            <div className="flex flex-col gap-2">
              {detail.universities.map((u) => (
                <div key={u.name} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 border border-border">
                  <p className="text-sm text-fg font-medium flex-1 pr-3">{u.name}</p>
                  {u.cutoff !== null ? (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0 bg-navy text-white">
                      Agg ≤{u.cutoff}
                    </span>
                  ) : (
                    <span className="text-xs text-fg-muted shrink-0">Entrance exam</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Job Roles */}
          {detail.jobRoles?.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-3">Career Roles</h3>
              <div className="flex flex-wrap gap-2">
                {detail.jobRoles.map((r) => (
                  <span key={r} className="text-xs px-3 py-1.5 rounded-full border border-border text-fg-soft bg-white">{r}</span>
                ))}
              </div>
            </section>
          )}

          {/* Earning & cost */}
          <section className="bg-gold-faint border border-gold/20 rounded-2xl p-5">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gold mb-1.5">
              Earning potential
            </p>
            <p className="text-base font-semibold text-navy mb-3">{detail.salary}</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-navy/70">
              {detail.tuitionTier && (
                <span className="capitalize">Study cost: {detail.tuitionTier}</span>
              )}
              {detail.demand && (
                <span className="capitalize">Job demand: {detail.demand}</span>
              )}
            </div>
          </section>
        </div>

        {/* CTA Footer */}
        <div className="p-5 border-t border-border bg-white shrink-0 flex gap-3">
          <Link
            to={`/chat?goal=${encodeURIComponent(title)}`}
            className="flex-1 text-center py-3 rounded-full bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-colors"
          >
            Get personalised advice →
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-3 rounded-full border border-border text-fg-soft text-sm hover:border-navy hover:text-navy transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </>
  );
}

/* ─── Roadmap Step ──────────────────────────────────────── */

function ScoreBar({ label, value }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[13px] text-fg-soft">{label}</span>
        <span className="text-[12px] font-semibold text-navy tabular-nums">
          {value}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-navy transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function RoadmapStep({ step, title, body, last = false }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 bg-navy">
          {step}
        </div>
        {!last && <div className="w-px flex-1 my-1 bg-border" style={{ minHeight: 24 }} />}
      </div>
      <div className="pb-5">
        <p className="text-sm font-semibold text-navy mb-1">{title}</p>
        <p className="text-[13px] text-fg-soft leading-[1.6]">{body}</p>
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
