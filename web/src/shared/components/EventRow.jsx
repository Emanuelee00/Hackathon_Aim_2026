import Icon from './Icon.jsx';
import { Badge } from './Primitives.jsx';
import { spaceById } from '../data/spaces.js';
import { shortDate } from '../lib/format.js';

export default function EventRow({ event, onOpen, compact = false }) {
  const space = spaceById[event.space];
  return <button className={`event-row ${compact ? 'compact' : ''}`} onClick={() => onOpen(event.id)}>
    <span className={`event-symbol ${space.color}`}><Icon name={space.icon} size={22} /></span>
    <span className="event-row-main"><strong>{event.title}</strong><span>{event.organizer}</span><small className="mobile-event-date">{shortDate(event.date)} · {event.start}</small></span>
    {!compact && <span className="event-row-date"><strong>{shortDate(event.date)}</strong><small>{event.start} – {event.end}</small></span>}
    <Badge status={event.status} /><Icon name="right" size={17} className="row-chevron" />
  </button>;
}
