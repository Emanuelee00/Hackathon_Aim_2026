import { useState } from 'react';
import { bookableSpaces } from '../../../shared/data/spaces.js';
import { validateEvent } from '../../../shared/lib/planning.js';

const emptyEvent = { title: '', category: '', organizer: '', email: '', date: '', start: '09:00', end: '10:00', space: 'atelier', participants: 1, revenue: 0, costs: 0, description: '', opportunity: '', tasks: [], report: null, status: 'pending' };

export default function EventForm({ event, events, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...emptyEvent, ...event });
  const [error, setError] = useState('');
  const change = ({ target }) => setDraft(current => ({ ...current, [target.name]: target.type === 'number' ? Number(target.value) : target.value }));
  const submit = formEvent => {
    formEvent.preventDefault();
    const next = { ...draft, id: draft.id || `event-${Date.now()}` };
    const message = validateEvent(next, events);
    if (message) return setError(message);
    onSave(next);
  };

  return <form className="event-form" onSubmit={submit}>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-grid"><label className="field field-wide"><span>Nom du projet *</span><input name="title" value={draft.title} onChange={change} required /></label><label className="field"><span>Catégorie</span><input name="category" value={draft.category} onChange={change} placeholder="Atelier, rencontre…" /></label><label className="field"><span>Organisateur *</span><input name="organizer" value={draft.organizer} onChange={change} required /></label><label className="field field-wide"><span>Adresse e-mail</span><input type="email" name="email" value={draft.email} onChange={change} /></label>
      <label className="field"><span>Date *</span><input type="date" name="date" value={draft.date} onChange={change} required /></label><label className="field"><span>Début *</span><input type="time" name="start" value={draft.start} onChange={change} required /></label><label className="field"><span>Fin *</span><input type="time" name="end" value={draft.end} onChange={change} required /></label><label className="field"><span>Espace *</span><select name="space" value={draft.space} onChange={change}>{spaces.map(space => <option key={space.id} value={space.id}>{space.name} · {space.capacity} pers.</option>)}</select></label>
      <label className="field"><span>Participants *</span><input type="number" min="1" name="participants" value={draft.participants} onChange={change} required /></label><label className="field"><span>Recettes prévues (€)</span><input type="number" min="0" name="revenue" value={draft.revenue} onChange={change} /></label><label className="field"><span>Coûts prévus (€)</span><input type="number" min="0" name="costs" value={draft.costs} onChange={change} /></label>
      <label className="field field-full"><span>Description de la demande</span><textarea name="description" rows="4" value={draft.description} onChange={change} /></label><label className="field field-full"><span>Opportunité pour les résidentes</span><textarea name="opportunity" rows="3" value={draft.opportunity} onChange={change} placeholder="Participation volontaire, transmission, rencontre…" /></label></div>
    <div className="form-actions"><button type="button" className="button button-quiet" onClick={onCancel}>Annuler</button><button className="button button-dark">Enregistrer la demande</button></div>
  </form>;
}
