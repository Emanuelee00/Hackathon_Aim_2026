import { useState } from 'react';
import { validateVisitSlot } from '../visits.js';

export default function VisitSlotForm({ site, guide, slots, onSave }) {
  const [draft, setDraft] = useState({ date: '', start: '09:00', end: '09:30', guide: guide || '' });
  const [error, setError] = useState('');
  const change = ({ target }) => setDraft(current => ({ ...current, [target.name]: target.value }));
  const submit = e => {
    e.preventDefault();
    const slot = { ...draft, guide: draft.guide.trim(), site, id: crypto.randomUUID(), booking: null };
    const message = validateVisitSlot(slot, slots);
    if (message) return setError(message);
    onSave([...slots, slot]);
    setError('');
    setDraft(current => ({ ...current, date: '' }));
  };
  return <details><summary>Ouvrir un créneau de visite pour ce site</summary><form className="event-form" onSubmit={submit}>
    <div className="form-grid"><label className="field field-wide"><span>Date de visite</span><input type="date" name="date" required value={draft.date} onChange={change} /></label><label className="field"><span>Début de visite</span><input type="time" name="start" required value={draft.start} onChange={change} /></label><label className="field"><span>Fin de visite</span><input type="time" name="end" required value={draft.end} onChange={change} /></label><label className="field field-full"><span>Référent de la visite</span><input name="guide" required value={draft.guide} onChange={change} /></label></div>
    {error && <p role="alert" className="form-error">{error}</p>}<button className="button button-quiet">Ouvrir le créneau</button>
  </form></details>;
}
