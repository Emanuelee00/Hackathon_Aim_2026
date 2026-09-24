import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { EmptyState } from '../../shared/components/Primitives.jsx';
import { spaceById, TODAY } from '../../shared/data/spaces.js';
import { dateLabel } from '../../shared/lib/format.js';
import { commitments, missions, signedUp, toggleSignup } from './volunteering.js';

const NAME_KEY = 'marthe-volunteer-name';
const readName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };

function Role({ event, need, name, onToggle }) {
  const count = signedUp(event, need.id).length;
  const mine = signedUp(event, need.id).some(volunteer => volunteer.name.toLowerCase() === name.trim().toLowerCase());
  return <div className="volunteer-role">
    <strong>{need.role}</strong>
    <span className="gauge" aria-hidden="true">{Array.from({ length: need.needed }, (_, index) => <i key={index} className={index < count ? 'filled' : ''} />)}</span>
    <small>{count} / {need.needed} inscrit·es</small>
    <button className={`button button-small ${mine ? 'button-dark' : 'button-quiet'}`} disabled={!name.trim() || (!mine && count >= need.needed)} onClick={() => onToggle(event, need.id)}>{mine ? 'Inscrit·e, se désinscrire' : count >= need.needed ? 'Complet' : 'Je m’inscris'}</button>
  </div>;
}

function Mission({ event, name, onToggle }) {
  return <article className="panel volunteer-mission">
    <span className="date-tile lavender"><small>{dateLabel(event.date, { month: 'short' })}</small><strong>{event.date.slice(-2)}</strong></span>
    <div><h3>{event.title}{event.status === 'pending' && <small className="verdict warn">sous réserve</small>}</h3><p>{dateLabel(event.date, { weekday: 'long' })}, {event.start} – {event.end} · {spaceById[event.space].name} · {event.participants} personnes attendues</p>
      <div className="volunteer-roles">{event.volunteerNeeds.map(need => <Role key={need.id} event={event} need={need} name={name} onToggle={onToggle} />)}</div></div>
  </article>;
}

export default function VolunteerSpace() {
  const { events, saveEvent, notify } = useStore();
  const [name, setName] = useState(readName);
  const changeName = value => { setName(value); try { localStorage.setItem(NAME_KEY, value); } catch { /* the name is only a convenience */ } };
  const onToggle = (event, needId) => {
    try { const next = toggleSignup(event, needId, name); saveEvent(next); notify(next.volunteers.length > (event.volunteers || []).length ? 'Merci ! Inscription enregistrée.' : 'Désinscription enregistrée.'); }
    catch (error) { notify(error.message); }
  };
  const list = missions(events, TODAY);
  const mine = commitments(events, name);
  return <div className="volunteer-space">
    <header className="landing-hero"><p className="eyebrow">ESPACE BÉNÉVOLES</p><h1>{name.trim() ? `Bonjour ${name.trim()}` : 'Bonjour'}</h1><p>Voici les coups de main dont le lieu a besoin. Inscrivez-vous en un clic, l’équipe vous confirme la veille.</p></header>
    <div className="volunteer-layout">
      <section className="volunteer-list">{list.map(event => <Mission key={event.id} event={event} name={name} onToggle={onToggle} />)}{!list.length && <EmptyState title="Aucune mission pour l’instant" text="Les prochains besoins apparaîtront ici." />}</section>
      <aside className="panel volunteer-aside"><label className="field"><span>Votre prénom</span><input value={name} onChange={e => changeName(e.target.value)} placeholder="Pour vous inscrire" /></label>
        <h3>Mes engagements</h3>{mine.length ? <ul>{mine.map(({ event, need }) => <li key={`${event.id}-${need.id}`}><strong>{need.role}</strong><small>{event.title}, {dateLabel(event.date)}</small></li>)}</ul> : <p>Aucun pour l’instant.</p>}</aside>
    </div>
  </div>;
}
