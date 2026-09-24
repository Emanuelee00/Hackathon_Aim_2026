import Icon from '../../../shared/components/Icon.jsx';
import { spaceById } from '../../../shared/data/spaces.js';
import { dateLabel } from '../../../shared/lib/format.js';

export default function ProposalCard({ match, event, onDecide }) {
  return <article className="proposal">
    <p className="proposal-when"><Icon name="calendar" size={16} />{dateLabel(event.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {event.start}–{event.end} · {spaceById[event.space]?.name}</p>
    <h3>{event.title}</h3>
    {match.cv && match.source !== 'cv' && <span className="cv-link-badge"><Icon name="sparkles" size={14} />Aussi en lien avec votre CV</span>}
    <p className="proposal-why">{match.rationale}</p>
    <p className="proposal-benefit"><Icon name="sparkles" size={17} /><span><strong>Pour vous : </strong>{match.benefit}</span></p>
    <details className="plan-details"><summary>À vérifier avant de venir</summary><p>{match.vigilance}</p></details>
    <footer><button className="button button-quiet" onClick={() => onDecide(match, 'declined')}>Refuser</button><button className="button button-dark" onClick={() => onDecide(match, 'accepted')}><Icon name="check" size={17} />Accepter</button></footer>
  </article>;
}
