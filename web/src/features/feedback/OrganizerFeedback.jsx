import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { EmptyState } from '../../shared/components/Primitives.jsx';
import { spaceById, TODAY } from '../../shared/data/spaces.js';
import { dateLabel } from '../../shared/lib/format.js';
import { feedbackErrors, feedbackEvents, logisticsAnswers, residentAnswers } from './organizerFeedback.js';

const empty = { rating: 0, attendance: '', residents: '', logistics: '', comment: '' };

function Choices({ name, options, value, onChange }) {
  return <div className="option-list" role="radiogroup">{Object.entries(options).map(([key, label]) => <label key={key}><input type="radio" name={name} checked={value === key} onChange={() => onChange(key)} />{label}</label>)}</div>;
}

function Stars({ value, onChange }) {
  return <div className="stars" role="radiogroup" aria-label="Note sur 5">{[1, 2, 3, 4, 5].map(star => <button key={star} type="button" role="radio" aria-checked={value === star} aria-label={`${star} sur 5`} className={star <= value ? 'on' : ''} onClick={() => onChange(star)}>★</button>)}</div>;
}

function FeedbackForm({ event, onSent }) {
  const { saveEvent } = useStore();
  const [draft, setDraft] = useState(empty);
  const [errors, setErrors] = useState({});
  const set = key => value => { setDraft(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: '' })); };
  const submit = e => {
    e.preventDefault();
    const feedback = { ...draft, attendance: draft.attendance === '' ? Number.NaN : Number(draft.attendance) };
    const found = feedbackErrors(feedback);
    if (Object.keys(found).length) return setErrors(found);
    saveEvent({ ...event, organizerFeedback: { ...feedback, comment: draft.comment.trim(), recordedAt: new Date().toISOString() } });
    onSent();
  };
  return <form className="panel feedback-form" onSubmit={submit} noValidate>
    <div className="field"><span>Votre satisfaction globale</span><Stars value={draft.rating} onChange={set('rating')} />{errors.rating && <p className="form-error">{errors.rating}</p>}</div>
    <label className="field"><span>Combien de personnes sont venues ?</span><input type="number" min="0" value={draft.attendance} onChange={e => set('attendance')(e.target.value)} placeholder="Ex. 70" />{errors.attendance && <p className="form-error">{errors.attendance}</p>}</label>
    <div className="field"><span>Des femmes hébergées ont-elles participé ?</span><Choices name="residents" options={residentAnswers} value={draft.residents} onChange={set('residents')} />{errors.residents && <p className="form-error">{errors.residents}</p>}</div>
    <div className="field"><span>L’accueil et la logistique</span><Choices name="logistics" options={logisticsAnswers} value={draft.logistics} onChange={set('logistics')} /></div>
    <label className="field"><span>Un mot pour l’équipe</span><textarea rows="4" maxLength={1000} value={draft.comment} onChange={e => set('comment')(e.target.value)} placeholder="Ce qui a bien marché, ce qu’on pourrait améliorer" /></label>
    <button className="button button-dark">Envoyer mon bilan</button>
  </form>;
}

export default function OrganizerFeedback() {
  const { events } = useStore();
  const [eventId, setEventId] = useState(() => new URLSearchParams(window.location.search).get('event') || '');
  const [sent, setSent] = useState(false);
  const choices = feedbackEvents(events, TODAY);
  const event = events.find(item => item.id === eventId);
  return <div className="feedback-space">
    <header className="landing-hero"><p className="eyebrow">BILAN DE VOTRE ÉVÉNEMENT</p><h1>Comment ça s’est passé ?</h1><p>{event ? `${event.title}, ${dateLabel(event.date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${spaceById[event.space].name}. ` : ''}Deux minutes suffisent, et vos réponses nous aident à défendre le lieu auprès de nos financeurs.</p></header>
    {!event && <label className="field panel feedback-pick"><span>Votre événement</span><select value={eventId} onChange={e => setEventId(e.target.value)}><option value="">Choisir</option>{choices.map(item => <option key={item.id} value={item.id}>{item.title} · {dateLabel(item.date)}</option>)}</select></label>}
    {event && (sent || event.organizerFeedback ? <div className="panel feedback-form"><span className="verdict ok">Bilan envoyé</span><h2>Merci</h2><p>Votre bilan est ajouté au tableau de bord d’impact de Chez Marthe. À bientôt dans le lieu.</p></div> : <FeedbackForm event={event} onSent={() => setSent(true)} />)}
    {!event && !choices.length && <EmptyState title="Aucun événement à évaluer" text="Le lien de bilan vous est envoyé après votre événement." />}
  </div>;
}
