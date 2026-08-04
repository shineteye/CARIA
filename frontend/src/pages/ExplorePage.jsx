import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';

/* ─── Data ──────────────────────────────────────────────── */

const STREAMS = [
  'All Streams',
  'Science & Health',
  'Engineering & Tech',
  'Business & Finance',
  'Arts & Law',
  'TVET & Skilled Trades',
];

const CAREERS = [
  {
    id: 1,
    title: 'Public Health Nurse',
    tag: 'Health',
    description: 'Providing essential healthcare services and health education within Ghanaian communities.',
    shs: 'General Science',
    stream: 'Science & Health',
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
    stream: 'Engineering & Tech',
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
    stream: 'TVET & Skilled Trades',
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
    stream: 'Arts & Law',
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
    stream: 'Engineering & Tech',
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
    stream: 'Science & Health',
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
    stream: 'Arts & Law',
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
  const [activeStream, setActiveStream] = useState('All Streams');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(6);
  const [selected, setSelected] = useState(null);

  const streamCounts = useMemo(() => {
    const counts = { 'All Streams': CAREERS.length };
    STREAMS.slice(1).forEach((s) => {
      counts[s] = CAREERS.filter((c) => c.stream === s).length;
    });
    return counts;
  }, []);

  const filtered = CAREERS.filter((c) => {
    const matchStream = activeStream === 'All Streams' || c.stream === activeStream;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.shs.toLowerCase().includes(q);
    return matchStream && matchSearch;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleStream = (s) => {
    setActiveStream(s);
    setVisibleCount(6);
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
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(6); }}
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
            <select className="w-full text-sm text-fg-soft border border-border bg-cream/50 rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:border-navy">
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
              Discover career paths tailored for the Ghanaian job market. Select any career to see the full academic roadmap.
            </p>
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
                onChange={(e) => { setSearch(e.target.value); setVisibleCount(6); }}
                className="w-full pl-11 pr-5 py-3 rounded-full border border-border bg-white text-sm text-fg outline-none focus:border-navy transition-colors"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STREAMS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStream(s)}
                  className={`text-sm px-4 py-2 rounded-full border transition-all duration-150 ${
                    activeStream === s
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-fg border-border hover:border-navy'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-fg-muted mb-4">
            {filtered.length} career{filtered.length === 1 ? '' : 's'} found
            {activeStream !== 'All Streams' ? ` in ${activeStream}` : ''}
          </p>

          {/* Career Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {visible.map((career) => (
              <CareerCard key={career.id} career={career} onClick={() => setSelected(career)} />
            ))}
            {visible.length === 0 && (
              <p className="col-span-full text-center text-fg-muted py-16 text-sm">
                No careers match your search.
              </p>
            )}
          </div>

          {hasMore && (
            <div className="flex justify-center pb-4">
              <button
                onClick={() => setVisibleCount((n) => n + 6)}
                className="px-10 py-3 rounded-full border border-navy text-navy text-sm font-medium hover:bg-navy hover:text-white transition-all duration-150"
              >
                Load More Careers
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Detail Panel */}
      {selected && (
        <CareerDetail career={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

/* ─── Career Card ───────────────────────────────────────── */

function CareerCard({ career, onClick }) {
  const { title, tag, description, shs, Icon } = career;

  return (
    <button
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden flex flex-col border border-border hover:border-navy hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 text-left"
    >
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-navy/5">
            <Icon />
          </div>
          <span className="text-[10px] font-semibold tracking-wider uppercase text-gold px-2 py-1">
            {tag}
          </span>
        </div>

        <h3 className="text-lg font-bold text-navy mb-2 leading-snug">{title}</h3>
        <p className="text-[15px] text-fg-soft leading-[1.65] flex-1">{description}</p>

        <div className="border-t border-border my-4" />

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-fg-muted mb-1">Required SHS Stream:</p>
            <p className="text-[15px] font-semibold text-navy truncate">{shs}</p>
          </div>
          <span className="text-xs font-medium text-navy opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex items-center gap-1">
            View roadmap →
          </span>
        </div>
      </div>
    </button>
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

          {/* About */}
          <p className="text-[15px] text-fg-soft leading-[1.7]">{detail.about}</p>

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
                body={`Target Category ${detail.shsCategories.join('/')} schools. Elect: ${detail.electives.join(', ')}.`}
              />
              <RoadmapStep
                step="WASSCE"
                title={`Target aggregate ${detail.wassce}`}
                body="Aim for A1–B3 in all electives. Core subjects: C6 minimum in English, Maths, and Science."
                last
              />
            </div>
          </section>

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
          <section>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-fg-muted mb-3">Career Roles</h3>
            <div className="flex flex-wrap gap-2">
              {detail.jobRoles.map((r) => (
                <span key={r} className="text-xs px-3 py-1.5 rounded-full border border-border text-fg-soft bg-white">{r}</span>
              ))}
            </div>
          </section>

          {/* Salary */}
          <section className="bg-gold-faint border border-gold/20 rounded-2xl p-4">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-gold mb-1">Earning Potential</p>
            <p className="text-base font-bold text-navy">{detail.salary}</p>
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
