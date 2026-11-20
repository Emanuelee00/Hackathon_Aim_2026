import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { PageIntro } from '../../shared/components/Primitives.jsx';
import { dateLabel } from '../../shared/lib/format.js';
import { residents } from '../opportunities/data/residents.js';
import { statusLabels } from '../opportunities/components/SuggestionCard.jsx';
import { residentContacts, residentSkills } from '../journeys/tracking.js';

function InfoList({ label, items }) {
  return <div className="resident-info"><small>{label}</small>{items.length ? <ul>{items.map(item => <li key={item}>{item}</li>)}</ul> : <p>À documenter</p>}</div>;
}

// Without consent, only the name is shown: the profile stays private.
function ResidentCard({ resident, matches, eventById, navigate }) {
  const activities = matches.filter(match => match.resident_id === resident.id && match.status !== 'suggested' && eventById[match.eventId]);
  const skills = residentSkills(matches, eventById, resident.id).map(item => item.skill);
  const contacts = residentContacts(matches, eventById, resident.id).map(item => item.contact);
  return <article className="resident-card panel">
    <header><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><div><h3>{resident.first_name}</h3><small>{resident.fictional ? 'Profil fictif' : 'Profil'} · {resident.consent ? 'accord de partage enregistré' : 'accord non recueilli'}</small></div></header>
    {resident.consent ? <>
      <div className="resident-infos"><InfoList label="Objectifs" items={resident.goals} /><InfoList label="Compétences" items={resident.skills} /><InfoList label="Langues" items={resident.languages} /><div className="resident-info"><small>Disponibilités</small><p>{resident.availability}</p></div></div>
      <div className="resident-activities"><small>Activités ({activities.length})</small>{activities.length ? <ul>{activities.map(match => <li key={match.id}><span>{eventById[match.eventId].title} · {dateLabel(eventById[match.eventId].date)}</span><b>{statusLabels[match.status]}</b></li>)}</ul> : <p>Aucune activité proposée pour l’instant.</p>}</div>
      {(skills.length > 0 || contacts.length > 0) && <div className="resident-infos"><InfoList label="Acquis pendant les parcours" items={skills} /><InfoList label="Contacts noués" items={contacts} /></div>}
      {activities.some(match => match.status === 'accepted') && <button className="button button-quiet resident-link" onClick={() => navigate('journeys')}><Icon name="leaf" size={15} />Voir le suivi du parcours</button>}
    </> : <p className="resident-private"><Icon name="heart" size={16} />Les informations de {resident.first_name} restent privées tant qu’elle n’a pas donné son accord.</p>}
  </article>;
}

export default function Residents({ navigate }) {
  const { events, matches } = useStore();
  const eventById = Object.fromEntries(events.map(event => [event.id, event]));
  return <><PageIntro eyebrow="LES PERSONNES ACCOMPAGNÉES" title="Nos résidentes" description="Leurs objectifs, leurs compétences et les activités auxquelles elles participent."><span className="ethical-ai"><Icon name="heart" size={16} />Données fictives · partagées avec accord</span></PageIntro><div className="residents-grid">{residents.map(resident => <ResidentCard key={resident.id} resident={resident} matches={matches} eventById={eventById} navigate={navigate} />)}</div></>;
}
