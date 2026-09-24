import Icon from './Icon.jsx';
import { EmptyState } from './Primitives.jsx';
import { spaceById, TODAY } from '../data/spaces.js';
import { dateLabel } from '../lib/format.js';

export default function Upcoming({ events, onOpen, navigate }) {
  const upcoming = events.filter(event => event.status === 'confirmed' && event.date >= TODAY).sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)).slice(0, 3);
  return <section className="panel upcoming"><div className="panel-heading"><h3>Les prochains rendez-vous</h3><span className="small-label">CETTE SEMAINE</span></div>
    {!upcoming.length && <EmptyState title="Une page à écrire" text="Les événements confirmés apparaîtront ici." />}
    <div className="timeline">{upcoming.map(event => <button key={event.id} className="timeline-item" onClick={() => onOpen(event.id)}><span className={`date-tile ${spaceById[event.space].color}`}><small>{dateLabel(event.date, { weekday: 'short' }).replace('.', '')}</small><strong>{event.date.slice(-2)}</strong></span><span><small>{event.start} – {event.end}</small><strong>{event.title}</strong><span><Icon name="pin" size={12} />{spaceById[event.space].name}</span></span><Icon name="right" size={15} /></button>)}</div>
    <button className="text-link timeline-link" onClick={() => navigate('calendar')}>Ouvrir le calendrier<Icon name="arrow" size={16} /></button>
  </section>;
}
