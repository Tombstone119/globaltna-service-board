'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Send } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { TRADES } from '@/lib/trades';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewJobPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Plumbing',
    location: '',
    contactName: '',
    contactEmail: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?next=/jobs/new');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="app">
        <TopBar showSearch={false} />
        <aside className="rail" />
        <main className="main">
          <div className="feed"><div className="empty"><h3>Redirecting…</h3></div></div>
        </main>
      </div>
    );
  }

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    else if (form.title.trim().length < 4) e.title = 'Make the title a bit more descriptive.';
    if (!form.description.trim()) e.description = 'Description is required.';
    else if (form.description.trim().length < 10) e.description = 'Add a couple more details.';
    if (!form.category) e.category = 'Pick a trade.';
    if (form.contactEmail && !EMAIL_RE.test(form.contactEmail.trim())) {
      e.contactEmail = 'That email looks off.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      const created = await api.createJob({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        location: form.location.trim(),
        contactName: form.contactName.trim(),
        contactEmail: form.contactEmail.trim(),
      });
      router.push(`/jobs/${created._id}`);
    } catch (err) {
      setServerError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <TopBar showSearch={false} />
      <aside className="rail">
        <div className="map">
          <div className="label">Step</div>
          <div className="area">New work order</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            Add a clear title, the trade you need, and a short description. Tradespeople in your area
            see new jobs the moment you post them.
          </p>
        </div>
        <div className="section">
          <h4>Tips</h4>
          <div className="legend">
            <div className="row" aria-disabled><span className="swatch" style={{ background: '#E08A1F' }} />Be specific</div>
            <div className="row" aria-disabled><span className="swatch" style={{ background: '#3F78E0' }} />Add a postcode</div>
            <div className="row" aria-disabled><span className="swatch" style={{ background: '#6B8E4E' }} />Mention access</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="form-shell">
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            <div className="order-num">New work order · draft</div>
            <h1>Post a job</h1>
            <p className="lead">Three jobs posted this morning are waiting on a plumber. Make yours easy to claim.</p>

            <div className="field">
              <label htmlFor="title">Job title</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Replace kitchen tap"
                aria-invalid={!!errors.title}
                autoFocus
              />
              {errors.title && <span className="error">{errors.title}</span>}
            </div>

            <div className="field">
              <label>Trade</label>
              <div className="trade-pick">
                {TRADES.map((t) => {
                  const Icon = t.Icon;
                  const selected = form.category === t.category;
                  return (
                    <button
                      type="button"
                      key={t.key}
                      className={selected ? 'selected' : ''}
                      onClick={() => set('category', t.category)}
                      aria-pressed={selected}
                    >
                      <Icon size={20} color={t.color} />
                      {t.category}
                    </button>
                  );
                })}
              </div>
              {errors.category && <span className="error">{errors.category}</span>}
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="location">Location (postcode or area)</label>
                <input
                  id="location"
                  value={form.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="SW11 · Battersea"
                />
              </div>
              <div className="field">
                <label htmlFor="contactName">Contact name</label>
                <input
                  id="contactName"
                  value={form.contactName}
                  onChange={(e) => set('contactName', e.target.value)}
                  placeholder="How tradespeople should address you"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="contactEmail">Contact email</label>
              <input
                id="contactEmail"
                type="email"
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!errors.contactEmail}
              />
              {errors.contactEmail && <span className="error">{errors.contactEmail}</span>}
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What needs doing? Helpful details: when it started, what you've tried, anything tricky about access."
                aria-invalid={!!errors.description}
              />
              {errors.description && <span className="error">{errors.description}</span>}
            </div>

            {serverError && (
              <div className="error" role="alert" style={{ fontSize: 13 }}>
                {serverError}
              </div>
            )}

            <div className="form-actions">
              <Link href="/" className="btn btn-ghost">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={14} />
                {submitting ? 'Posting…' : 'Post job'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
