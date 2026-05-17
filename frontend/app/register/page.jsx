'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/lib/auth';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RegisterPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get('next') || '/';
  const { register } = useAuth();

  const [form, setForm] = useState({ email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    const email = form.email.trim();
    if (!email) e.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) e.email = 'That email looks off.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ email: form.email.trim(), password: form.password });
      router.push(nextPath);
    } catch (err) {
      setServerError(err.message || 'Could not create your account.');
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <TopBar showSearch={false} />
      <aside className="rail">
        <div className="map">
          <div className="label">Auth</div>
          <div className="area">Create account</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            One account lets you post and manage jobs. We only store your email and a hashed password.
          </p>
        </div>
      </aside>

      <main className="main">
        <div className="form-shell">
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            <div className="order-num">Auth · register</div>
            <h1>Create your account</h1>
            <p className="lead">Takes about ten seconds. You&apos;ll be logged in straight away.</p>

            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                autoFocus
                autoComplete="email"
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="At least 8 characters"
                aria-invalid={!!errors.password}
                autoComplete="new-password"
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={(e) => set('confirm', e.target.value)}
                placeholder="Repeat your password"
                aria-invalid={!!errors.confirm}
                autoComplete="new-password"
              />
              {errors.confirm && <span className="error">{errors.confirm}</span>}
            </div>

            {serverError && (
              <div className="error" role="alert" style={{ fontSize: 13 }}>
                {serverError}
              </div>
            )}

            <div className="form-actions">
              <Link
                href={`/login${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                className="btn btn-ghost"
              >
                Already have an account? Log in
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <UserPlus size={14} />
                {submitting ? 'Creating…' : 'Create account'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterPageInner />
    </Suspense>
  );
}
