import Icon from '../../../shared/components/Icon.jsx';
import { dateLabel } from '../../../shared/lib/format.js';

export default function ApplicationList({ applications, eventById, onWithdraw }) {
  if (!applications.length) return null;
  return <section className="proposal-group"><h2><Icon name="clock" size={19} />Mes candidatures<small>L’équipe répond selon les places et le budget</small></h2>
    <ul className="application-list">{applications.map(match => <li key={match.id} className={match.status}>
      <div><strong>{eventById[match.eventId].title}</strong><small>{dateLabel(eventById[match.eventId].date, { weekday: 'long', day: 'numeric', month: 'long' })}</small></div>
      <span className="application-status">{match.status === 'applied' ? 'En attente de réponse' : 'Pas retenue cette fois'}</span>
      {match.status === 'applied' ? <button className="text-link" onClick={() => onWithdraw(match)}>Retirer ma candidature</button> : <p>Places ou budget limités : candidatez à d’autres activités.</p>}
    </li>)}</ul>
  </section>;
}
