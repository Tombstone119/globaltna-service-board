'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/TopBar';
import SideRail from '@/components/SideRail';
import JobCard from '@/components/JobCard';
import { STATUSES, tradeByCategory } from '@/lib/trades';
import { api } from '@/lib/api';

export default function HomePage() {
  const [allJobs, setAllJobs]           = useState([]);
  const [jobs, setJobs]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeCategory, setCategory]   = useState('all');
  const [activeStatus, setStatus]       = useState('all');
  const [search, setSearch]             = useState('');

  // Pull every job once so the sidebar counts reflect the whole board, not the
  // currently filtered slice.
  useEffect(() => {
    let cancelled = false;
    api.listJobs()
      .then((data) => { if (!cancelled) setAllJobs(data || []); })
      .catch(() => { /* surfaced via the feed-fetch effect below */ });
    return () => { cancelled = true; };
  }, []);

  // Re-fetch the visible feed whenever the user changes a server-side filter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    if (activeStatus !== 'all')   params.status   = activeStatus;
    api.listJobs(params)
      .then((data) => { if (!cancelled) { setJobs(data || []); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [activeCategory, activeStatus]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return jobs;
    return jobs.filter((j) => {
      const hay = `${j.title} ${j.description} ${j.category} ${j.location || ''}`.toLowerCase();
      return hay.includes(s);
    });
  }, [jobs, search]);

  const counts = useMemo(() => {
    const c = { __total: allJobs.length, __openTotal: 0, Open: 0, 'In Progress': 0, Closed: 0 };
    allJobs.forEach((j) => {
      c[j.status] = (c[j.status] || 0) + 1;
      c[j.category] = (c[j.category] || 0) + 1;
      if (j.status === 'Open') c.__openTotal++;
    });
    return c;
  }, [allJobs]);

  return (
    <div className="app">
      <TopBar search={search} onSearchChange={setSearch} />
      <SideRail activeCategory={activeCategory} onCategoryChange={setCategory} counts={counts} />

      <main className="main">
        <div className="subhead">
          <div className="title-block">
            <div className="meta">Work board · live</div>
            <h1>
              {activeCategory === 'all'
                ? 'All jobs'
                : (tradeByCategory[activeCategory]?.category || activeCategory)}
            </h1>
          </div>
          <div className="tags" role="tablist" aria-label="Filter by status">
            <button
              type="button"
              role="tab"
              aria-selected={activeStatus === 'all'}
              className={`tab all ${activeStatus === 'all' ? 'active' : ''}`}
              onClick={() => setStatus('all')}
            >
              <span className="spine" style={{ background: '#1F2A44' }} />
              <span className="label">All</span>
              <span className="count">{counts.__total}</span>
            </button>
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                role="tab"
                aria-selected={activeStatus === s.value}
                className={`tab ${s.cls} ${activeStatus === s.value ? 'active' : ''}`}
                onClick={() => setStatus(s.value)}
              >
                <span
                  className="spine"
                  style={{
                    background:
                      s.cls === 'open' ? '#E08A1F' :
                      s.cls === 'progress' ? '#3F78E0' : '#959CA9',
                  }}
                />
                <span className="label">{s.value}</span>
                <span className="count">{counts[s.value] || 0} · {s.step}</span>
              </button>
            ))}
          </div>
          <div className="right">
            <span className="count-summary">
              {String(filtered.length).padStart(2, '0')} ON BOARD
            </span>
          </div>
        </div>

        <div className="feed">
          {loading && (
            <div className="empty"><h3>Loading work board…</h3></div>
          )}
          {error && !loading && (
            <div className="empty">
              <h3>Couldn&apos;t load jobs.</h3>
              <p>{error}</p>
              <p style={{ marginTop: 12, fontSize: 12 }}>
                Make sure the Express API is running on{' '}
                <code>{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}</code>.
              </p>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="empty">
              <h3>No jobs match your filters.</h3>
              <p>Try widening your trade or status filter — or post a new job.</p>
            </div>
          )}
          {!loading && !error && filtered.map((job, i) => (
            <JobCard key={job._id} job={job} index={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
