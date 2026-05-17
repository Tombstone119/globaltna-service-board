'use client';

import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

export default function TopBar({ search = '', onSearchChange, showSearch = true }) {
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
      <Link href="/jobs/new" className="btn btn-primary">
        <Plus size={16} /> Post a job
      </Link>
    </header>
  );
}
