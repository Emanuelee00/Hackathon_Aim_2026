import { useState } from 'react';
import { cancelVisit, recordVisitOutcome } from '../visits.js';
import { dateLabel } from '../../../shared/lib/format.js';

const outcomes = { suitable: 'Lieu adapté au projet', changes: 'Conditions à ajuster', unsuitable: 'Lieu non adapté', absent: 'Personne absente' };

export default function VisitBooking({ slot, slots, onSave }) {
  const [result, setResult] = useState(slot.outcome?.result || 'suitable');
  const [notes, setNotes] = useState(slot.outcome?.notes || '');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const apply = (e, action) => {
    e.preventDefault();
    try { onSave(action()); setError(''); } catch (failure) { setError(failure.message); }
  };
  return <div className="request-module"><p><strong>Visite du {dateLabel(slot.date)} · {slot.start}–{slot.end}</strong></p><p>Référent : {slot.guide} · Visiteur : {slot.booking.visitor} ({slot.booking.organizer})</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    {slot.outcome ? <p><strong>{outcomes[slot.outcome.result]}</strong> — {slot.outcome.notes} · Retour consigné par {slot.outcome.guide}</p> : <>
      <form className="event-form" onSubmit={e => apply(e, () => cancelVisit(slots, slot.id, reason))}><label className="field"><span>Motif d’annulation de la visite</span><input required value={reason} onChange={e => setReason(e.target.value)} /></label><button className="button button-quiet">Annuler la visite et libérer le créneau</button></form>
      <details><summary>Consigner le résultat après la visite</summary><form className="event-form" onSubmit={e => apply(e, () => recordVisitOutcome(slots, slot.id, result, notes))}><label className="field"><span>Résultat de la visite</span><select aria-label="Résultat de la visite" value={result} onChange={e => setResult(e.target.value)}>{Object.entries(outcomes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field"><span>Observations et suites convenues</span><textarea required value={notes} onChange={e => setNotes(e.target.value)} /></label><button className="button button-dark">Enregistrer le résultat de la visite</button></form></details>
    </>}
  </div>;
}
