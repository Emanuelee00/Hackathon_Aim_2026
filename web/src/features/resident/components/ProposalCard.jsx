import Icon from '../../../shared/components/Icon.jsx';
import { dateLabel } from '../../../shared/lib/format.js';

export default function ProposalCard({ match, event, onStatus }) {
  return <article className="match-card"><header><span className="eyebrow">{event.title}</span><h3>{dateLabel(event.date)}</h3></header><p className="match-reason">{match.rationale}</p><div className="match-points"><p><Icon name="sparkles" size={15} /><span><strong>Ce que ça peut vous apporter</strong>{match.benefit}</span></p><p><Icon name="help" size={15} /><span><strong>À vérifier ensemble</strong>{match.vigilance}</span></p></div>
    <footer><button className="button button-quiet" onClick={() => onStatus(match.id, 'declined')}>Je décline</button><button className="button button-dark" onClick={() => onStatus(match.id, 'accepted')}><Icon name="check" size={16} />J’accepte</button></footer></article>;
}
