import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/layout/AppHeader';
import { compareCareers } from '../services/api';

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const careerIds = (searchParams.get('ids') || '').split(',').filter(Boolean);

  useEffect(() => {
    if (!careerIds.length) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    compareCareers(careerIds)
      .then(({ comparison: result }) => {
        if (!cancelled) setComparison(result || []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load comparison. Please try again from Explore.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get('ids')]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-cream" style={{ fontFamily: 'var(--font-body)' }}>
      <AppHeader variant="cream" />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-gold mb-2">Compare</p>
          <h1 className="text-[2rem] text-navy mb-2 leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Weigh Your Options Side by Side
          </h1>
          <p className="text-sm text-fg-soft leading-relaxed max-w-130">
            Fit and money scores are weighted using your own profile — what matters most to you, and what your family can realistically afford.
          </p>
          <Link to="/explore" className="inline-block mt-3 text-sm font-medium text-navy hover:text-gold transition-colors">
            ← Back to Explore
          </Link>
        </div>

        {loading && <p className="text-fg-muted text-sm">Loading comparison…</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && !error && !comparison.length && (
          <p className="text-fg-muted text-sm">
            Nothing to compare yet. Go to <Link to="/explore" className="underline text-navy">Explore</Link>, select 2–3 careers, then tap Compare.
          </p>
        )}

        {!loading && comparison.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-border rounded-2xl overflow-hidden">
              <thead>
                <tr className="bg-navy text-white text-left text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-semibold">Career</th>
                  {comparison.map((c) => (
                    <th key={c.careerId} className="px-4 py-3 font-semibold">{c.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-sm text-fg">
                <Row label="Overall match" cells={comparison.map((c) => `${c.overallScore}%`)} highlight />
                <Row label="Passion / fit score" cells={comparison.map((c) => `${c.fitScore}%`)} />
                <Row label="Money score" cells={comparison.map((c) => `${c.moneyScore}%`)} />
                <Row label="Salary range" cells={comparison.map((c) => c.salaryRange)} />
                <Row label="Tuition/cost tier" cells={comparison.map((c) => c.tuitionTier)} capitalize />
                <Row label="Job market demand" cells={comparison.map((c) => c.demand)} capitalize />
                <Row label="BECE target" cells={comparison.map((c) => c.beceTarget || '—')} />
                <Row label="SHS stream" cells={comparison.map((c) => c.shsStream || '—')} />
                <Row
                  label="University options"
                  cells={comparison.map((c) =>
                    (c.universities || []).length
                      ? c.universities.map((u) => `${u.institution} (${u.cutoff != null ? `cut-off ${u.cutoff}` : 'cut-off not in our data'})`).join('; ')
                      : '—',
                  )}
                />
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, cells, highlight = false, capitalize = false }) {
  return (
    <tr className={`border-t border-border ${highlight ? 'bg-gold-faint/40' : ''}`}>
      <td className="px-4 py-3 font-semibold text-navy whitespace-nowrap">{label}</td>
      {cells.map((cell, i) => (
        <td key={i} className={`px-4 py-3 align-top ${capitalize ? 'capitalize' : ''}`}>{cell}</td>
      ))}
    </tr>
  );
}
