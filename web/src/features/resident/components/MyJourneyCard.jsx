import Icon from '../../../shared/components/Icon.jsx';
import { exportAttestation } from '../../../shared/lib/exports.js';
import { dateLabel } from '../../../shared/lib/format.js';
import { emptyJourney, journeyStage, nextStepLabels } from '../../journeys/tracking.js';

export default function MyJourneyCard({ match, resident, event }) {
  const journey = { ...emptyJourney, ...match.journey };
  const ready = journey.participation === 'participated' && journey.skills.trim();
  return <article className="journey-card panel"><header><span className={`resident-avatar ${resident.color}`}>{resident.initials}</span><div><p className="eyebrow">{event.title}</p><h3>{dateLabel(event.date)}</h3></div></header><strong className="journey-stage">{journeyStage(journey)}</strong><div className="journey-outcomes"><span><small>Compétence</small>{journey.skills || 'À documenter'}</span><span><small>Prochaine étape</small>{nextStepLabels[journey.nextStep]}</span></div>
    {ready ? <button className="button button-dark journey-edit" onClick={() => exportAttestation(match, resident, event)}><Icon name="download" size={16} />Télécharger mon attestation</button> : <p className="ai-caption">Complétez le suivi avec l’équipe pour débloquer votre attestation.</p>}</article>;
}
