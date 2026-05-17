'use client';

import { TRADES } from '@/lib/trades';

export default function SideRail({ activeCategory = 'all', onCategoryChange, counts = {} }) {
  const totalOpen = counts.__openTotal || 0;
  const total = counts.__total || 0;

  return (
    <aside className="rail">
      <div className="map" aria-hidden="true">
        <div className="label">Board overview</div>
        <div className="area">Trade map · preview</div>
        <div className="scene" style={{ marginTop: 10 }}>
          <span className="pin you"  style={{ left: '48%', top: '50%' }} />
          <span className="pin open" style={{ left: '20%', top: '32%' }} />
          <span className="pin open" style={{ left: '64%', top: '22%' }} />
          <span className="pin open" style={{ left: '74%', top: '58%' }} />
          <span className="pin prog" style={{ left: '30%', top: '70%' }} />
          <span className="pin open" style={{ left: '52%', top: '20%' }} />
          <span className="pin prog" style={{ left: '14%', top: '54%' }} />
        </div>
        <div className="footer-row">
          <span>{totalOpen} open · {total} total</span>
          <span className="live">SAMPLE</span>
        </div>
      </div>

      <div className="section">
        <h4>Trades</h4>
        <div className="legend">
          <button
            type="button"
            className={`row ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => onCategoryChange?.('all')}
          >
            <span className="swatch" style={{ background: 'var(--gtna-navy)' }} />
            All trades
            <span className="count">{total}</span>
          </button>
          {TRADES.map((t) => (
            <button
              type="button"
              key={t.key}
              className={`row ${activeCategory === t.category ? 'active' : ''}`}
              onClick={() => onCategoryChange?.(t.category)}
            >
              <span className="swatch" style={{ background: t.color }} />
              {t.category}
              <span className="count">{counts[t.category] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <h4>Workflow</h4>
        <div className="legend">
          <div className="row" aria-disabled>
            <span className="swatch" style={{ background: '#E08A1F' }} />
            Open
            <span className="count">{counts.Open || 0}</span>
          </div>
          <div className="row" aria-disabled>
            <span className="swatch" style={{ background: '#3F78E0' }} />
            In progress
            <span className="count">{counts['In Progress'] || 0}</span>
          </div>
          <div className="row" aria-disabled>
            <span className="swatch" style={{ background: '#959CA9' }} />
            Closed
            <span className="count">{counts.Closed || 0}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
