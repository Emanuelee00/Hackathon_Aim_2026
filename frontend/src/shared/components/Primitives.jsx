import Icon from './Icon.jsx';
import { statuses } from '../data/spaces.js';

export function Badge({ status }) { return <span className={`badge ${status}`}><i />{statuses[status]}</span>; }

export function SectionTitle({ eyebrow, title, description, action }) {
  return <div className="section-heading"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

export function EmptyState({ title, text, action }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="leaf" size={28} /></span><h3>{title}</h3><p>{text}</p>{action}</div>;
}

export function PageIntro({ eyebrow, title, description, children }) {
  return <div className="page-intro"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{children}</div>;
}

export function Metric({ icon, label, value, caption, tone = 'sage' }) {
  return <div className="metric"><span className={`metric-icon ${tone}`}><Icon name={icon} size={20} /></span><div className="metric-top"><span>{label}</span></div><strong>{value}</strong><p>{caption}</p></div>;
}
