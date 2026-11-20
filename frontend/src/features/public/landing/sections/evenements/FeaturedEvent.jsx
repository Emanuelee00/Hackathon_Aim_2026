import { dayNames, monthNames, cleanTitle, fullMonths } from './agenda.js';

// L'évènement mis en avant : une grande carte au-dessus des jours.
export default function FeaturedEvent({ event }) {
  const day = new Date(`${event.date}T12:00:00`);
  const time = event.start ? `${event.start}${event.end ? `–${event.end}` : ''}` : 'Toute la journée';
  return <article className="pg-featured" aria-label="Évènement à la une">
    <div className="pg-feat-date"><span>{dayNames[(day.getDay() + 6) % 7].slice(0, 3)}</span><strong>{day.getDate()}</strong><small>{monthNames[day.getMonth()]}</small></div>
    <div className="pg-feat-body">
      <p className="pg-feat-badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg>À la une</p>
      <h3>{cleanTitle(event.title)}</h3>
      <p className="pg-feat-meta">{dayNames[(day.getDay() + 6) % 7]} {day.getDate()} {fullMonths[day.getMonth()]} · {time}{event.place ? ` · ${event.place}` : ''}</p>
      {event.link && <a className="pg-register" href={event.link} target="_blank" rel="noopener noreferrer">S’inscrire ↗</a>}
    </div>
  </article>;
}
