import Icon from '../../../shared/components/Icon.jsx';
import MatchReasons from '../../../shared/components/MatchReasons.jsx';
import { spaceById } from '../../../shared/data/spaces.js';
import { dateLabel } from '../../../shared/lib/format.js';

// Team proposals are accepted directly; open and CV-based ones become applications for the team to confirm.
export default function ProposalCard({ match, event, onDecide, apply = false }) {
  return <article className="proposal">
    <p className="proposal-when"><Icon name="calendar" size={16} />{dateLabel(event.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {event.start}–{event.end} · {spaceById[event.space]?.name}</p>
    <h3>{event.title}</h3>
    {event.referent && <p className="proposal-referent"><Icon name="users" size={15} />Référent·e Chez Marthe : <strong>{event.referent}</strong></p>}
    {match.cv && match.source !== 'cv' && <span className="cv-link-badge"><Icon name="sparkles" size={14} />Aussi en lien avec votre CV</span>}
    <MatchReasons reasons={match.reasons} forResident />
    <p className="proposal-why">{match.rationale}</p>
    <p className="proposal-benefit"><Icon name="sparkles" size={17} /><span><strong>Pour vous : </strong>{match.benefit}</span></p>
    <details className="plan-details"><summary>À vérifier avant de venir</summary><p>{match.vigilance}</p></details>
    <footer><button className="button button-quiet" onClick={() => onDecide(match, 'declined')}>{apply ? 'Pas intéressée' : 'Refuser'}</button><button className="button button-dark" onClick={() => onDecide(match, apply ? 'applied' : 'accepted')}><Icon name="check" size={17} />{apply ? 'Je candidate' : 'Accepter'}</button></footer>
    {apply && <p className="plan-note"><Icon name="help" size={15} />Toutes les résidentes peuvent candidater. L’équipe répond selon les places et le budget.</p>}
  </article>;
}
