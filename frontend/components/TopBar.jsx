'use client';

import Link from 'next/link';
import { LogIn, LogOut, Plus, Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function TopBar({ search = '', onSearchChange, showSearch = true }) {
  const { user, isLoading, logout } = useAuth();

  const postHref = user ? '/jobs/new' : '/login?next=/jobs/new';

  return (
    <header className="topbar">
      <Link href="/" className="logo" aria-label="GlobalTNA home">
        <img src="/assets/logo-light.svg" alt="GlobalTNA" />
      </Link>
      {showSearch && (
        <div className="search">
          <span className="icon"><Search size={16} /></span>
          <input
            type="text"
            placeholder="Search jobs by title, description, or trade…"
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
        </div>
      )}
      <div className="spacer" />

      {!isLoading && user && (
        <div className="user-meta" aria-label="Signed-in user">
          <span className="name">{user.email}</span>
          <span className="sub">Signed in</span>
        </div>
      )}

      {!isLoading && user && (
        <button type="button" className="btn btn-on-dark btn-sm" onClick={logout}>
          <LogOut size={14} /> Log out
        </button>
      )}

      {!isLoading && !user && (
        <Link href="/login" className="btn btn-on-dark btn-sm">
          <LogIn size={14} /> Log in
        </Link>
      )}

      <Link href={postHref} className="btn btn-primary">
        <Plus size={16} /> Post a job
      </Link>
    </header>
  );
}
