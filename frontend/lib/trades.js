// Trade taxonomy — kept in sync with the design system + backend enum.
// `category` is the schema string ("Plumbing", "Electrical", …);
// `key` is the design-system slug used to style spines/labels.
// `Icon` is a named lucide component so the bundler can tree-shake.
import { Hammer, PaintRoller, Wrench, Zap } from 'lucide-react';

export const TRADES = [
  { key: 'plumbing',   category: 'Plumbing',   Icon: Wrench,      color: '#3F78E0', bg: '#E3ECFB' },
  { key: 'electrical', category: 'Electrical', Icon: Zap,         color: '#E08A1F', bg: '#FCEEDA' },
  { key: 'painting',   category: 'Painting',   Icon: PaintRoller, color: '#C45A8B', bg: '#FBE6EE' },
  { key: 'joinery',    category: 'Joinery',    Icon: Hammer,      color: '#6B8E4E', bg: '#E8EFDF' },
];

export const tradeByCategory = Object.fromEntries(TRADES.map(t => [t.category, t]));

export const STATUSES = [
  { value: 'Open',        cls: 'open',     step: '1/3' },
  { value: 'In Progress', cls: 'progress', step: '2/3' },
  { value: 'Closed',      cls: 'closed',   step: '3/3' },
];

export const statusMeta = Object.fromEntries(STATUSES.map(s => [s.value, s]));

export function relTime(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.max(0, Math.floor(ms / 60000));
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function orderNum(id, index) {
  // Stable-ish display number derived from the Mongo ObjectId tail.
  if (!id) return String(1040 + (index || 0)).padStart(4, '0');
  const tail = String(id).slice(-4);
  return tail.toUpperCase();
}
