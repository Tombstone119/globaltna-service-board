import { statusMeta } from '@/lib/trades';

export default function StatusTag({ status }) {
  const meta = statusMeta[status] || statusMeta.Open;
  return (
    <span className={`tag ${meta.cls}`}>
      <span className="spine" />
      <span className="label">{status}</span>
      <span className="step">{meta.step}</span>
    </span>
  );
}
