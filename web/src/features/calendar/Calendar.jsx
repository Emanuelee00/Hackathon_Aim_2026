import { useMemo, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { spaces, spaceById, TODAY } from '../../shared/data/spaces.js';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { addMonths, calendarDays, monthLabel } from './calendar.js';

const weekdays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

export default function Calendar({ onOpen }) {
  const { events } = useStore();
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [space, setSpace] = useState('all');
  const days = useMemo(() => calendarDays(month, TODAY), [month]);
  const visible = useMemo(() => events.filter(event => event.status !== 'cancelled' && (space === 'all' || event.space === space)), [events, space]);
  const eventsByDate = useMemo(() => visible.reduce((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event];
    return groups;
  }, {}), [visible]);

  return <>
    <PageIntro eyebrow="GESTION DU LIEU" title="Le calendrier" description="Une vue claire des rencontres qui font vivre Chez Marthe.">
      <label className="calendar-filter"><span>Espace</span><select value={space} onChange={event => setSpace(event.target.value)}><option value="all">Tous les espaces</option>{spaces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </PageIntro>
    <section className="panel calendar-panel">
      <header className="calendar-toolbar"><h2>{monthLabel(month)}</h2><div><button className="button button-quiet today-button" onClick={() => setMonth(TODAY.slice(0, 7))}>Aujourd’hui</button><button className="icon-button" aria-label="Mois précédent" onClick={() => setMonth(current => addMonths(current, -1))}><Icon name="left" /></button><button className="icon-button" aria-label="Mois suivant" onClick={() => setMonth(current => addMonths(current, 1))}><Icon name="right" /></button></div></header>
      <div className="calendar-scroll"><div className="calendar-grid">{weekdays.map(day => <div className="weekday" key={day}>{day}</div>)}{days.map(day => <div className={`calendar-day ${day.current ? '' : 'outside'} ${day.today ? 'is-today' : ''}`} key={day.date}><span className="day-number">{day.day}</span><div className="day-events">{(eventsByDate[day.date] || []).sort((a, b) => a.start.localeCompare(b.start)).map(event => <button className={`calendar-event ${spaceById[event.space].color} ${event.status}`} key={event.id} onClick={() => onOpen(event.id)}><span>{event.start}</span><strong>{event.title}</strong></button>)}</div></div>)}</div></div>
      <footer className="calendar-legend">{spaces.map(item => <span key={item.id}><i className={item.color} />{item.name}</span>)}<span><i className="pending-mark" />En attente</span></footer>
    </section>
  </>;
}
