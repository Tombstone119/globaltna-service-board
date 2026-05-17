'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Mail, MapPin, Trash2, User } from 'lucide-react';
import TopBar from '@/components/TopBar';
import StatusTag from '@/components/StatusTag';
import { tradeByCategory, relTime, orderNum, STATUSES } from '@/lib/trades';
import { api } from '@/lib/api';

export default function JobDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [job, setJob]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getJob(id)
      .then((data) => { if (!cancelled) { setJob(data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [id]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  async function handleStatus(next) {
    if (!next || next === job?.status) return;
    setSaving(true);
    try {
      const updated = await api.updateStatus(id, next);
      setJob(updated);
      flash(`Status updated to ${next}.`);
    } catch (err) {
      flash(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this job? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteJob(id);
      router.push('/');
    } catch (err) {
      flash(err.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="app">
        <TopBar showSearch={false} />
        <aside className="rail" />
        <main className="main">
          <div className="feed"><div className="empty"><h3>Loading work order…</h3></div></div>
        </main>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="app">
        <TopBar showSearch={false} />
        <aside className="rail" />
        <main className="main">
          <div className="feed">
            <div className="empty">
              <h3>Job not found.</h3>
              <p>{error || 'It may have been closed or removed.'}</p>
              <p style={{ marginTop: 16 }}>
                <Link href="/" className="btn btn-outline btn-sm">
                  <ArrowLeft size={14} /> Back to the board
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const trade = tradeByCategory[job.category] || tradeByCategory.Plumbing;
  const TradeIcon = trade.Icon;

  return (
    <div className="app">
      <TopBar showSearch={false} />
      <aside className="rail">
        <div className="map" aria-hidden="true">
          <div className="label">Work order</div>
          <div className="area">WO-{orderNum(job._id, 0)}</div>
          <div className="scene" style={{ marginTop: 10 }}>
            <span className="pin you" style={{ left: '48%', top: '50%' }} />
            <span className="pin open" style={{ left: '24%', top: '34%' }} />
            <span className="pin prog" style={{ left: '70%', top: '60%' }} />
          </div>
          <div className="footer-row">
            <span>{job.location || 'Location not set'}</span>
            <span className="live">SAMPLE</span>
          </div>
        </div>

        <div className="section">
          <h4>Workflow</h4>
          <div className="legend">
            {STATUSES.map((s) => (
              <div
                key={s.value}
                className={`row ${job.status === s.value ? 'active' : ''}`}
                aria-disabled
              >
                <span
                  className="swatch"
                  style={{
                    background:
                      s.cls === 'open' ? '#E08A1F' :
                      s.cls === 'progress' ? '#3F78E0' : '#959CA9',
                  }}
                />
                {s.value}
                <span className="count">{s.step}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="subhead">
          <div className="title-block">
            <div className="meta">Work order · WO-{orderNum(job._id, 0)}</div>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                className="ic"
                style={{
                  background: trade.bg, color: trade.color,
                  width: 32, height: 32, borderRadius: 8,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <TradeIcon size={16} />
              </span>
              {job.category}
            </h1>
          </div>
          <div />
          <div className="right">
            <Link href="/" className="btn btn-outline btn-sm">
              <ArrowLeft size={14} /> Back to the board
            </Link>
          </div>
        </div>

        <div className="detail-shell">
          <article className="detail-card" style={{ '--spine': trade.color }}>
            <div className="order-num">Work order · WO-{orderNum(job._id, 0)}</div>
            <div className="trade-label" style={{ color: trade.color }}>{job.category}</div>
            <h1>{job.title}</h1>
            <div className="meta-row">
              {job.location && (
                <span className="item"><MapPin size={14} />{job.location}</span>
              )}
              <span className="item"><Clock size={14} />Posted {relTime(job.createdAt)}</span>
              <span className="item"><StatusTag status={job.status} /></span>
            </div>

            <section>
              <h4>Description</h4>
              <p className="description">{job.description}</p>
            </section>

            {(job.contactName || job.contactEmail) && (
              <section>
                <h4>Posted by</h4>
                <div className="contact-row">
                  <span className="avatar md">
                    {(job.contactName || '?').slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <div className="name">
                      <User size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {job.contactName || 'Homeowner'}
                    </div>
                    {job.contactEmail && (
                      <div className="sub">
                        <Mail size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                        <a href={`mailto:${job.contactEmail}`}>{job.contactEmail}</a>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </article>

          <aside className="detail-actions">
            <h4>Status</h4>
            <div className="current-tag"><StatusTag status={job.status} /></div>

            <div className="field" style={{ marginBottom: 14 }}>
              <label htmlFor="status-select">Update status</label>
              <select
                id="status-select"
                value={job.status}
                onChange={(e) => handleStatus(e.target.value)}
                disabled={saving || deleting}
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.value}</option>
                ))}
              </select>
            </div>

            <h4>Danger zone</h4>
            <div className="stack">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting || saving}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Trash2 size={14} />
                {deleting ? 'Deleting…' : 'Delete job'}
              </button>
            </div>
          </aside>
        </div>
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
