import { useMemo, useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { bookableSpaces, spaceById, TODAY } from '../../shared/data/spaces.js';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { dateLabel } from '../../shared/lib/format.js';
import { addMonths, calendarDays, monthLabel } from './calendar.js';
import { mondayOf, shiftWeek } from './week.js';
import WeekBySpace from './WeekBySpace.jsx';

const weekdays = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
const views = [['month', 'Mois'], ['week', 'Semaine par espace']];

function Stepper({ title, onToday, todayLabel, onMove, unit }) {
  return <><h2>{title}</h2><div><button className="button button-quiet today-button" onClick={onToday}>{todayLabel}</button><button className="icon-button" aria-label={`${unit} précédent${unit === 'Semaine' ? 'e' : ''}`} onClick={() => onMove(-1)}><Icon name="left" /></button><button className="icon-button" aria-label={`${unit} suivant${unit === 'Semaine' ? 'e' : ''}`} onClick={() => onMove(1)}><Icon name="right" /></button></div></>;
}

function MonthGrid({ month, space, onOpen }) {
  const { events } = useStore();
  const days = useMemo(() => calendarDays(month, TODAY), [month]);
  const eventsByDate = useMemo(() => events.filter(event => ['pending', 'confirmed', 'completed'].includes(event.status) && (space === 'all' || event.space === space)).reduce((groups, event) => {
    groups[event.date] = [...(groups[event.date] || []), event];
    return groups;
  }, {}), [events, space]);
  return <>
    <div className="calendar-scroll"><div className="calendar-grid">{weekdays.map(day => <div className="weekday" key={day}>{day}</div>)}{days.map(day => <div className={`calendar-day ${day.current ? '' : 'outside'} ${day.today ? 'is-today' : ''}`} key={day.date}><span className="day-number">{day.day}</span><div className="day-events">{(eventsByDate[day.date] || []).sort((a, b) => a.start.localeCompare(b.start)).map(event => <button className={`calendar-event ${spaceById[event.space].color} ${event.status}`} key={event.id} onClick={() => onOpen(event.id)}><span>{event.start}</span><strong>{event.title}</strong></button>)}</div></div>)}</div></div>
    <footer className="calendar-legend">{bookableSpaces.map(item => <span key={item.id}><i className={item.color} />{item.name}</span>)}<span><i className="pending-mark" />En attente</span></footer>
  </>;
}

export default function Calendar({ onOpen }) {
  const [month, setMonth] = useState(TODAY.slice(0, 7));
  const [space, setSpace] = useState('all');
  const [view, setView] = useState('month');
  const [monday, setMonday] = useState(mondayOf(TODAY));
  return <>
    <PageIntro eyebrow="GESTION DU LIEU" title="Le calendrier" description="Une vue claire des rencontres qui font vivre Chez Marthe.">
      {view === 'month' && <label className="calendar-filter"><span>Espace</span><select value={space} onChange={event => setSpace(event.target.value)}><option value="all">Tous les espaces</option>{bookableSpaces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
    </PageIntro>
    <section className="panel calendar-panel">
      <header className="calendar-toolbar"><div className="view-tabs filter-tabs" aria-label="Affichage">{views.map(([value, label]) => <button key={value} className={view === value ? 'active' : ''} aria-pressed={view === value} onClick={() => setView(value)}>{label}</button>)}</div>
        {view === 'month'
          ? <Stepper title={monthLabel(month)} todayLabel="Aujourd’hui" unit="Mois" onToday={() => setMonth(TODAY.slice(0, 7))} onMove={amount => setMonth(current => addMonths(current, amount))} />
          : <Stepper title={`Semaine du ${dateLabel(monday)}`} todayLabel="Cette semaine" unit="Semaine" onToday={() => setMonday(mondayOf(TODAY))} onMove={amount => setMonday(current => shiftWeek(current, amount))} />}
      </header>
      {view === 'month' ? <MonthGrid month={month} space={space} onOpen={onOpen} /> : <WeekBySpace monday={monday} onOpen={onOpen} />}
    </section>
  </>;
}
