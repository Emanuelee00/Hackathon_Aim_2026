import { useState } from 'react';
import { useStore } from '../../app/store.jsx';
import { bookableSpaces, TODAY } from '../../shared/data/spaces.js';

// A hosted association asks for a space: the request joins the team's queue like any other.
export default function BookingForm({ association }) {
  const { events, saveEvent, notify } = useStore();
  const [draft, setDraft] = useState({ title: '', space: 'reunion', date: '', start: '10:00', end: '12:00', participants: 6 });
  const [error, setError] = useState('');
  const change = ({ target }) => setDraft(current => ({ ...current, [target.name]: target.type === 'number' ? Number(target.value) : target.value }));
  const submit = e => {
    e.preventDefault();
    if (!draft.title.trim() || !draft.date || draft.date < TODAY || draft.end <= draft.start) return setError('Indiquez un objet, une date à venir et une fin après le début.');
    const taken = events.some(event => event.status === 'confirmed' && event.space === draft.space && event.date === draft.date && event.start < draft.end && event.end > draft.start);
    saveEvent({ ...draft, id: `event-${Date.now()}`, title: draft.title.trim(), requestType: 'rental', rentalUse: `Activité de ${association.name}, association hébergée.`, organizer: association.name, email: '', category: 'Association hébergée', referent: '', referentTeam: association.name, revenue: 0, costs: 0, description: '', opportunity: '', technical: [], tasks: [], report: null, status: 'pending', source: 'Espace associations', submittedAt: new Date().toISOString() });
    setError('');
    setDraft(current => ({ ...current, title: '', date: '' }));
    notify(taken ? 'Demande envoyée, mais ce créneau est déjà pris : l’équipe vous proposera une alternative.' : 'Demande envoyée à l’équipe, qui vous répond rapidement.');
  };
  return <form className="panel partner-panel" onSubmit={submit}><h3>Réserver un espace</h3>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-grid"><label className="field field-full"><span>Objet</span><input name="title" value={draft.title} onChange={change} placeholder="Réunion d’équipe, atelier…" /></label>
      <label className="field field-wide"><span>Espace</span><select name="space" value={draft.space} onChange={change}>{bookableSpaces.map(space => <option key={space.id} value={space.id}>{space.name}</option>)}</select></label>
      <label className="field field-wide"><span>Date</span><input type="date" name="date" min={TODAY} value={draft.date} onChange={change} /></label>
      <label className="field"><span>Début</span><input type="time" name="start" value={draft.start} onChange={change} /></label><label className="field"><span>Fin</span><input type="time" name="end" value={draft.end} onChange={change} /></label>
      <label className="field field-wide"><span>Personnes</span><input type="number" min="1" name="participants" value={draft.participants} onChange={change} /></label></div>
    <button className="button button-dark">Envoyer la demande</button>
  </form>;
}
