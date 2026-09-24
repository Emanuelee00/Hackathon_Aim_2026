import Icon from '../../../shared/components/Icon.jsx';
import MatchReasons from '../../../shared/components/MatchReasons.jsx';

const labels = { suggested: 'Suggestion IA', proposed: 'Proposée par l’équipe', applied: 'Candidature de la résidente', accepted: 'Accord donné', declined: 'Déclinée', dismissed: 'Écartée', not_selected: 'Candidature non retenue' };

function label(match) {
  if (match.status === 'suggested' && match.source === 'guided') return 'Suggestion guidée';
  if (match.status === 'proposed' && match.source === 'cv') return 'Proposée grâce au CV';
  if (match.status === 'accepted' && ['open', 'cv'].includes(match.source)) return 'Candidature retenue';
  return labels[match.status];
}

export default function SuggestionCard({ match, resident, event, onStatus }) {
  const applied = match.status === 'applied';
  return <article className={`match-card ${match.status}`}><header><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><div><p className="eyebrow">{label(match)}</p><h3>{resident.first_name}</h3></div><span className="fiction-label">PROFIL FICTIF</span></header>
    {applied && <p className="application-note"><Icon name="users" size={16} />{resident.first_name} s’est inscrite d’elle-même. Décidez selon les places ({event?.participants} prévues) et le budget.</p>}
    <MatchReasons reasons={match.reasons} />
    <p className="match-reason">{match.rationale}</p><div className="match-points"><p><Icon name="sparkles" size={15} /><span><strong>Bénéfice possible</strong>{match.benefit}</span></p><p><Icon name="help" size={15} /><span><strong>À vérifier ensemble</strong>{match.vigilance}</span></p></div>
    <footer>{match.status === 'suggested' && <><button className="button button-quiet" onClick={() => onStatus(match.id, 'dismissed')}>Écarter</button><button className="button button-dark" onClick={() => onStatus(match.id, 'proposed')}>Proposer à {resident.first_name}</button></>}{match.status === 'proposed' && <><button className="button button-quiet" onClick={() => onStatus(match.id, 'declined')}>Proposition déclinée</button><button className="button button-dark" onClick={() => onStatus(match.id, 'accepted')}><Icon name="check" size={16} />Accord donné</button></>}{applied && <><button className="button button-quiet" onClick={() => onStatus(match.id, 'not_selected')}>Pas cette fois</button><button className="button button-dark" onClick={() => onStatus(match.id, 'accepted')}><Icon name="check" size={16} />Retenir la candidature</button></>}{['accepted', 'declined', 'dismissed', 'not_selected'].includes(match.status) && <span className="match-final"><Icon name={match.status === 'accepted' ? 'checks' : 'leaf'} size={17} />{label(match)}</span>}</footer></article>;
}
