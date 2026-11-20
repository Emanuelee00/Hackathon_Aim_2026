import { useEffect, useState } from 'react';

import { apiUrl } from '../../../../../shared/lib/apiUrl.js';
import { socials } from '../../HomeShell.jsx';
import FeaturedEvent from './FeaturedEvent.jsx';
import { cleanTitle, colorOf, dayNames, demoEvents, fullMonths, isFeatured, isoDate, mondayOf } from './agenda.js';

export default function WeekProgramme({ title }) {
  const [weeks, setWeeks] = useState(4);
  const [events, setEvents] = useState(null); // null = loading, false = unavailable
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5); // events shown: 5 at most, then 5 more at each « Voir la suite » (the page grows)
  const [base] = useState(() => mondayOf(new Date()));
  useEffect(() => {
    let current = true;
    Promise.all(Array.from({ length: weeks }, (_, n) => {
      const monday = new Date(base);
      monday.setDate(base.getDate() + n * 7);
      return fetch(apiUrl(`/api/programmation?semaine=${isoDate(monday)}`)).then(r => (r.ok ? r.json() : Promise.reject(new Error('indisponible')))).then(d => d.events);
    }))
      .then(lists => { const all = lists.flat(); if (current) setEvents(all.length ? all : demoEvents(weeks, base)); })
      .catch(() => current && setEvents(demoEvents(weeks, base)));
    return () => { current = false; };
  }, [weeks, base]);

  const today = isoDate(new Date());
  const upcoming = (events || []).filter(event => event.date >= today).sort((x, y) => (x.date + (x.start || '')).localeCompare(y.date + (y.start || '')));
  const plain = text => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const needle = plain(query.trim());
  const shown = needle ? upcoming.filter(event => plain(`${event.title} ${event.place || ''}`).includes(needle)) : upcoming;
  // Un évènement peut être mis en avant : « ★ » au début de son titre dans Google Agenda (ou featured: true). Il s'affiche en premier, en grand.
  const featured = shown.find(isFeatured);
  const rest = featured ? shown.filter(event => event !== featured) : shown;
  const groups = [];
  for (const event of rest) {
    const last = groups[groups.length - 1];
    if (last && last.date === event.date) last.list.push(event); else groups.push({ date: event.date, list: [event] });
  }
  const hasMore = rest.length > limit || weeks < 12;
  const more = () => { setLimit(limit + 5); if (rest.length <= limit + 5) setWeeks(weeks + 4); };
  const items = [];
  let month = '';
  let left = limit;
  for (const group of groups) {
    if (left <= 0) break;
    const list = group.list.slice(0, left);
    left -= list.length;
    const day = new Date(`${group.date}T12:00:00`);
    const name = `${fullMonths[day.getMonth()]} ${day.getFullYear()}`;
    if (name !== month) { month = name; items.push(<li key={`m-${name}`} className="pg-month">{name}</li>); }
    items.push(<li key={group.date} className={`pg-day has${group.date === today ? ' is-today' : ''}${[0, 6].includes(day.getDay()) ? ' is-weekend' : ''}`}>
      <div className="pg-date">
        <span className="pg-name">{dayNames[(day.getDay() + 6) % 7].slice(0, 3)}</span>
        <strong className="pg-num">{day.getDate()}</strong>
        {group.date === today && <em className="pg-badge">Aujourd’hui</em>}
      </div>
      <div className="pg-events">{list.map(event => {
        const [c1, c2] = colorOf(cleanTitle(event.title));
        return <p key={event.title + event.start} className="pg-event" style={{ '--c1': c1, '--c2': c2 }}>
          <time>{event.start ? `${event.start}${event.end ? `–${event.end}` : ''}` : 'Toute la journée'}</time>
          <strong>{cleanTitle(event.title)}</strong>
          {event.place && <small>{event.place}</small>}
          {event.link && <a className="pg-register" href={event.link} target="_blank" rel="noopener noreferrer">S’inscrire ↗</a>}
        </p>;
      })}</div>
    </li>);
  }
  return <div className="pg">
    <div className="pg-top">
      <div>
        <h2 id="evenements-titre">{title}</h2>
      </div>
      <label className="pg-search">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Chercher une activité, un lieu…" aria-label="Chercher dans la programmation" />
      </label>
    </div>
    {events === false && <p className="pg-alert">La programmation n’est pas disponible pour le moment. Retrouvez-la sur notre Instagram.</p>}
    {events === null && <p className="pg-alert" aria-live="polite">Chargement de la programmation…</p>}
    {events && !shown.length && <p className="pg-alert">{needle ? 'Aucune activité ne correspond à votre recherche.' : 'Rien de prévu pour le moment : revenez bientôt ou suivez-nous sur Instagram.'}</p>}
    {featured && <FeaturedEvent event={featured} />}
    <ol className="pg-days pg-agenda">{items}</ol>
    {events && hasMore && <button type="button" className="pg-more" onClick={more}>Voir la suite</button>}
    <p className="pg-note">Toute la programmation et les inscriptions sur notre <a href={socials[0].url} target="_blank" rel="noopener noreferrer">Instagram</a>.</p>
  </div>;
}
