import { spaceUrl } from '../../shared/lib/spaces.js';
import { logisticsAnswers, residentAnswers } from './organizerFeedback.js';

// Team side: the link to send to the organiser after the event, and their answer once received.
export default function FeedbackLinkPanel({ event, notify }) {
  const link = `${spaceUrl('bilan')}?event=${encodeURIComponent(event.id)}`;
  // Shown on screen or printed at the end of the event: organisers scan it on the spot.
  const qr = `/api/qr.svg?text=${encodeURIComponent(link)}`;
  const feedback = event.organizerFeedback;
  const copy = () => navigator.clipboard?.writeText(link).then(() => notify('Le lien du bilan est copié.'), () => notify(link));
  return <section className="detail-copy"><h3>Bilan de l’organisateur</h3>
    {feedback ? <>
      <p>{'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)} · {feedback.attendance} personnes · Résidentes présentes : {residentAnswers[feedback.residents]}{feedback.logistics && ` · ${logisticsAnswers[feedback.logistics]}`}</p>
      {feedback.comment && <p>« {feedback.comment} »</p>}
    </> : <><p>Après l’événement, envoyez ce lien à {event.organizer} ou faites scanner le QR code sur place : deux minutes pour la note, la fréquentation et la venue des résidentes.</p><img className="feedback-qr" src={qr} alt={`QR code du bilan de ${event.title}`} /></>}
    {!feedback && <div className="detail-actions"><button className="button button-quiet" onClick={copy}>Copier le lien du bilan</button><a className="button button-quiet" href={link} target="_blank" rel="noreferrer">Ouvrir</a><a className="button button-quiet" href={qr} download={`qr-bilan-${event.id}.svg`}>Télécharger le QR code</a></div>}
  </section>;
}
