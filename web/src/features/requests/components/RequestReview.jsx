import { useState } from 'react';
import { validateEvent } from '../../../shared/lib/planning.js';
import { requestQuestions, requestTypes } from '../workflow.js';

export default function RequestReview({ event, events, onSave, onClose, notify }) {
  const [reviewer, setReviewer] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [error, setError] = useState('');
  const committee = event.requestType === 'programming';
  const awaitingCommittee = committee && event.reviewStage !== 'committee';
  const submitToCommittee = () => {
    const message = validateEvent(event, events);
    if (message) return setError(message);
    if (requestQuestions.programming.some(([key]) => !event[key]?.trim())) return setError('Complétez les questions de programmation avant de présenter la demande au comité.');
    onSave({ ...event, reviewStage: 'committee', approval: null });
    notify('La demande est inscrite à l’examen du comité.');
    onClose();
  };
  const decide = status => {
    if (!reviewer.trim() || !note.trim() || !date) return setError('Renseignez la personne qui consigne la décision, sa date et son motif.');
    const next = { ...event, status, approval: { authority: committee ? 'committee' : 'coordinator', reviewer: reviewer.trim(), note: note.trim(), date, outcome: status } };
    if (status === 'confirmed') {
      const message = validateEvent(next, events, true);
      if (message) return setError(message);
    }
    onSave(next);
    notify(status === 'confirmed' ? 'La demande est approuvée et confirmée.' : 'Le refus est enregistré.');
    onClose();
  };
  if (!requestTypes[event.requestType]) return <p>Modifiez la demande pour choisir programmation ou location avant de l’examiner.</p>;
  return <section className="detail-copy">
    <h3>{committee ? 'Comité de coordination' : 'Décision de la coordinatrice'}</h3>
    {error && <p className="form-error" role="alert">{error}</p>}
    {awaitingCommittee ? <><p>La programmation est examinée en comité hebdomadaire selon la charte du lieu.</p><button className="button button-dark" onClick={submitToCommittee}>Présenter au comité</button></> : <>
      <p>{committee ? 'En attente du comité. Consignez ici la décision prise collectivement.' : 'Examinez la location au cas par cas et consignez les conditions convenues.'}</p>
      <div className="form-grid">
        <label className="field"><span>Décision consignée par</span><input value={reviewer} onChange={e => setReviewer(e.target.value)} /></label>
        <label className="field"><span>Date de la décision</span><input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
        <label className="field field-full"><span>{committee ? 'Motif et avis du comité au regard de la charte' : 'Motif et conditions de location convenues'}</span><textarea value={note} onChange={e => setNote(e.target.value)} rows="3" /></label>
      </div>
      <div className="detail-actions"><button className="button button-danger" onClick={() => decide('cancelled')}>Enregistrer le refus</button><button className="button button-dark" onClick={() => decide('confirmed')}>{committee ? 'Enregistrer l’accord du comité' : 'Approuver la location'}</button></div>
    </>}
  </section>;
}
