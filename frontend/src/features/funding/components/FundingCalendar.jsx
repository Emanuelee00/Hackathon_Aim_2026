import { shortDate } from '../../../shared/lib/format.js';
import { CALENDAR_MONTHS, calendarEvents, calendarMonths, monthStart } from '../calendar.js';
import { daysBetween } from '../funding.js';

const legend = [['urgent', 'Clôture dans moins de 15 jours'], ['deadline', 'Échéance d’un financeur'], ['task', 'Tâche de l’équipe'], ['late', 'Tâche en retard']];

export default function FundingCalendar({ funders, today, onOpen }) {
  const months = calendarMonths(today);
  const events = calendarEvents(funders, today);
  const lanes = Math.max(2, ...events.map(event => event.lane + 1));
  const todayPosition = daysBetween(months[0].start, today) / daysBetween(months[0].start, monthStart(today, CALENDAR_MONTHS));
  const monthYear = start => new Date(`${start}T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const first = monthYear(months[0].start);
  const last = monthYear(months[months.length - 1].start);
  const kind = event => event.kind === 'deadline' && daysBetween(today, event.date) < 15 ? 'urgent' : event.kind;
  return <section className="panel funding-calendar">
    <div className="panel-heading"><div><h3>{/^[aeiouy]/i.test(first) ? 'D’' : 'De '}{first} à {last}</h3><p>Cliquez une échéance pour ouvrir la fiche du financeur.</p></div></div>
    <div className="funding-months" style={{ '--lanes': lanes, '--months': months.length }}>
      {months.map(month => <div key={month.start} className="funding-month">{month.label}<small>{month.year}</small></div>)}
      <span className="funding-today" style={{ left: `${todayPosition * 100}%` }}><span>Aujourd’hui</span></span>
      {events.map(event => <button key={event.id} type="button" className={`funding-event ${kind(event)} ${event.position > .75 ? 'flip' : ''}`} style={{ left: `${event.position * 100}%`, top: `${56 + event.lane * 40}px` }} onClick={() => onOpen(event.funderId)} title={`${shortDate(event.date)} · ${event.label}`}>
        <i /><span>{shortDate(event.date)} · {event.label}</span>
      </button>)}
    </div>
    <div className="funding-legend">{legend.map(([key, label]) => <span key={key}><i className={`funding-dot ${key}`} />{label}</span>)}</div>
  </section>;
}
