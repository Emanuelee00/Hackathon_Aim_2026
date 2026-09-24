import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { exportAttestation } from '../../../shared/lib/exports.js';
import { dateLabel } from '../../../shared/lib/format.js';
import { emptyJourney, journeyStage, nextStepLabels } from '../../journeys/tracking.js';

export default function MyJourneyCard({ match, resident, event }) {
  const [downloaded, setDownloaded] = useState(false);
  const journey = { ...emptyJourney, ...match.journey };
  const ready = journey.participation === 'participated' && journey.skills.trim();
  return <article className="panel activity-card">
    <p className="proposal-when"><Icon name="calendar" size={16} />{dateLabel(event.date)}</p>
    <h3>{event.title}</h3>
    <span className="activity-stage">{journeyStage(journey)}</span>
    <dl><div><dt>Compétence</dt><dd>{journey.skills || 'À noter avec l’équipe'}</dd></div><div><dt>Contact</dt><dd>{journey.contact || 'Aucun pour le moment'}</dd></div><div><dt>Prochaine étape</dt><dd>{nextStepLabels[journey.nextStep]}</dd></div></dl>
    {ready ? <button className="button button-dark" onClick={() => { exportAttestation(match, resident, event); setDownloaded(true); }}><Icon name="download" size={17} />Télécharger mon attestation</button> : <p className="plan-note"><Icon name="help" size={15} />L’attestation sera disponible quand l’équipe aura noté votre participation.</p>}
    {downloaded && <p className="confirm" role="status"><Icon name="check" size={16} />Attestation téléchargée.</p>}
  </article>;
}
