import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { EmptyState, PageIntro } from '../../shared/components/Primitives.jsx';
import { residentById } from '../opportunities/data/residents.js';
import { journeyStats } from './tracking.js';
import JourneyCard from './components/JourneyCard.jsx';

export default function Journeys({ onEdit, navigate }) {
  const { events, matches } = useStore();
  const eventById = Object.fromEntries(events.map(event => [event.id, event]));
  const pending = matches.filter(match => match.status === 'proposed');
  const journeys = matches.filter(match => match.status === 'accepted' && residentById[match.resident_id] && eventById[match.eventId]);
  const stats = journeyStats(matches);

  return <><PageIntro eyebrow="DE L’OCCASION À L’AUTONOMIE" title="Suivi des parcours" description="Documenter les étapes choisies, sans réduire une personne à un score."><span className="ethical-ai"><Icon name="heart" size={16} />Données fictives · suivi humain</span></PageIntro><section className="journey-summary"><div><strong>{stats.active}</strong><span>parcours actifs</span></div><div><strong>{stats.participated}</strong><span>participations réalisées</span></div><div><strong>{stats.nextSteps}</strong><span>prochaines étapes engagées</span></div><div><strong>{stats.followed}</strong><span>suivis à 30 jours</span></div></section>{pending.length > 0 && <section className="consent-pending"><Icon name="clock" /><div><strong>{pending.length} proposition{pending.length > 1 ? 's' : ''} en attente de réponse</strong><p>Le parcours commence uniquement après l’accord de la résidente.</p></div><button className="text-link" onClick={() => navigate('opportunities')}>Voir les propositions<Icon name="arrow" size={15} /></button></section>}<div className="journeys-grid">{journeys.map(match => <JourneyCard key={match.id} match={match} resident={residentById[match.resident_id]} event={eventById[match.eventId]} onEdit={onEdit} />)}{!journeys.length && <section className="panel journeys-empty"><EmptyState title="Aucun parcours actif" text="Une fois une proposition acceptée librement, son suivi apparaîtra ici." action={<button className="button button-dark" onClick={() => navigate('opportunities')}>Explorer les opportunités</button>} /></section>}</div></>;
}
