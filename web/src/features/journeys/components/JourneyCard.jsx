import Icon from '../../../shared/components/Icon.jsx';
import { dateLabel } from '../../../shared/lib/format.js';
import { emptyJourney, journeyProgress, journeyStage } from '../tracking.js';

const nextSteps = { none: 'Aucune étape', training: 'Formation', interview: 'Entretien', job: 'Emploi ou mission', project: 'Projet personnel', network: 'Mise en réseau' };

export default function JourneyCard({ match, resident, event, onEdit }) {
  const journey = { ...emptyJourney, ...match.journey };
  const progress = journeyProgress(journey);
  return <article className="journey-card panel"><header><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><div><p className="eyebrow">PROFIL FICTIF · ACCORD ENREGISTRÉ</p><h3>{resident.first_name}</h3><small>{event.title} · {dateLabel(event.date)}</small></div><span className="journey-percent">{progress}%</span></header><div className="journey-progress"><i style={{ width: `${progress}%` }} /></div><strong className="journey-stage">{journeyStage(journey)}</strong><div className="journey-steps"><span className="done"><Icon name="check" />Consentement</span><span className={journey?.participation !== 'pending' ? 'done' : ''}><Icon name="users" />Participation</span><span className={journey?.nextStep !== 'none' ? 'done' : ''}><Icon name="sparkles" />Résultat</span><span className={journey?.followUp30 !== 'pending' ? 'done' : ''}><Icon name="clock" />Suivi</span></div>{journey && <div className="journey-outcomes"><span><small>Compétence</small>{journey.skills || 'À documenter'}</span><span><small>Prochaine étape</small>{nextSteps[journey.nextStep]}</span></div>}<button className="button button-quiet journey-edit" onClick={() => onEdit(match.id)}><Icon name="file" size={15} />Mettre à jour le parcours</button></article>;
}
