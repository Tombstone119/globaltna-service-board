import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';
import { tradeByCategory, relTime, orderNum } from '@/lib/trades';
import StatusTag from './StatusTag';

export default function JobCard({ job, index = 0 }) {
  const trade = tradeByCategory[job.category] || tradeByCategory.Plumbing;
  const TradeIcon = trade.Icon;

  return (
    <Link
      href={`/jobs/${job._id}`}
      className="job-card"
      style={{ '--spine': trade.color, '--paper': '#FFFCF5' }}
    >
      <div className="spine" />
      <div className="stamp">
        <div className="id">WO-{orderNum(job._id, index)}</div>
        <div className="ic" style={{ background: trade.bg, color: trade.color }}>
          <TradeIcon size={14} />
        </div>
      </div>
      <div className="body">
        <div className="trade-label" style={{ color: trade.color }}>{job.category}</div>
        <h3 className="title">{job.title}</h3>
        <div className="meta">
          {job.location && (
            <>
              <span><MapPin size={12} />{job.location}</span>
              <span className="sep">·</span>
            </>
          )}
          <span><Clock size={12} />{relTime(job.createdAt)}</span>
        </div>
      </div>
      <div className="right">
        <StatusTag status={job.status} />
        {job.contactName && <span className="location-hint">{job.contactName}</span>}
      </div>
    </Link>
  );
}
