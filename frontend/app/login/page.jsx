'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useAuth } from '@/lib/auth';

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get('next') || '/';
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e = {};
    if (!form.email.trim())    e.email    = 'Email is required.';
    if (!form.password)        e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    setServerError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      router.push(nextPath);
    } catch (err) {
      setServerError(err.message || 'Could not sign in.');
      setSubmitting(false);
    }
  }

  return (
    <div className="app">
      <TopBar showSearch={false} />
      <aside className="rail">
        <div className="map">
          <div className="label">Auth</div>
          <div className="area">Sign in</div>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
            You need an account to post a job or update status. Browsing the board stays public.
          </p>
        </div>
      </aside>

      <main className="main">
        <div className="form-shell">
          <form className="form-card" onSubmit={handleSubmit} noValidate>
            <div className="order-num">Auth · sign in</div>
            <h1>Log in</h1>
            <p className="lead">Welcome back. Sign in to manage jobs on the board.</p>

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
                placeholder="Your password"
                aria-invalid={!!errors.password}
                autoComplete="current-password"
              />
              {errors.password && <span className="error">{errors.password}</span>}
            </div>

            {serverError && (
              <div className="error" role="alert" style={{ fontSize: 13 }}>
                {serverError}
              </div>
            )}

            <div className="form-actions">
              <Link
                href={`/register${nextPath !== '/' ? `?next=${encodeURIComponent(nextPath)}` : ''}`}
                className="btn btn-ghost"
              >
                Create account
              </Link>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <LogIn size={14} />
                {submitting ? 'Signing in…' : 'Log in'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
