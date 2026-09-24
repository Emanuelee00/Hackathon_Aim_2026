import { spaceUrl } from '../../shared/lib/spaces.js';
import { logisticsAnswers, residentAnswers } from './organizerFeedback.js';

// Team side: the link to send to the organiser after the event, and their answer once received.
export default function FeedbackLinkPanel({ event, notify }) {
  const link = `${spaceUrl('bilan')}?event=${encodeURIComponent(event.id)}`;
  const feedback = event.organizerFeedback;
  const copy = () => navigator.clipboard?.writeText(link).then(() => notify('Le lien du bilan est copié.'), () => notify(link));
  return <section className="detail-copy"><h3>Bilan de l’organisateur</h3>
    {feedback ? <>
      <p>{'★'.repeat(feedback.rating)}{'☆'.repeat(5 - feedback.rating)} · {feedback.attendance} personnes · Résidentes présentes : {residentAnswers[feedback.residents]}{feedback.logistics && ` · ${logisticsAnswers[feedback.logistics]}`}</p>
      {feedback.comment && <p>« {feedback.comment} »</p>}
    </> : <p>Après l’événement, envoyez ce lien à {event.organizer} : deux minutes pour la note, la fréquentation et la venue des résidentes.</p>}
    {!feedback && <div className="detail-actions"><button className="button button-quiet" onClick={copy}>Copier le lien du bilan</button><a className="button button-quiet" href={link} target="_blank" rel="noreferrer">Ouvrir</a></div>}
  </section>;
}
