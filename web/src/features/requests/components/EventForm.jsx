import { useState } from 'react';
import { requestTypes, requestQuestions } from '../workflow.js';
import { bookableSpaces } from '../../../shared/data/spaces.js';
import { validateEvent } from '../../../shared/lib/planning.js';

const emptyEvent = { requestType: '', audience: '', missionFit: '', supportNeeds: '', rentalUse: '', equipmentNeeds: '', budgetDetails: '', title: '', category: '', organizer: '', email: '', referent: '', referentTeam: '', date: '', start: '09:00', end: '10:00', space: 'atelier', participants: 1, revenue: 0, costs: 0, description: '', opportunity: '', tasks: [], report: null, status: 'pending' };

export default function EventForm({ event, events, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...emptyEvent, ...event });
  const [error, setError] = useState('');
  const change = ({ target }) => setDraft(current => ({ ...current, [target.name]: target.type === 'number' ? Number(target.value) : target.value }));
  const submit = formEvent => {
    formEvent.preventDefault();
    const next = { ...draft, id: draft.id || `event-${Date.now()}`, status: draft.status === 'confirmed' ? 'pending' : draft.status, reviewStage: null, approval: null };
    const message = validateEvent(next, events);
    if (message) return setError(message);
    onSave(next);
  };

  return <form className="event-form" onSubmit={submit}>
    {error && <p className="form-error" role="alert">{error}</p>}
    {event?.status === 'confirmed' && <p>Après modification, cette demande devra être approuvée à nouveau.</p>}
    <label className="field"><span>Type de demande *</span><select name="requestType" value={draft.requestType} onChange={change} required><option value="">Choisir un type</option>{Object.entries(requestTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    {draft.requestType && <p>{draft.requestType === 'programming' ? 'Examen par le comité de coordination hebdomadaire, selon la charte du lieu.' : 'Traitement au cas par cas par la coordinatrice, sans attendre le comité.'}</p>}
    <div className="form-grid">{(requestQuestions[draft.requestType] || []).map(([name, label]) => <label className="field field-full" key={name}><span>{label}</span><textarea name={name} value={draft[name]} onChange={change} rows="2" /></label>)}</div>
    {draft.requestType && <p>Ces réponses peuvent être complétées plus tard, mais sont nécessaires à l’approbation. Indiquez « Aucun » si aucun besoin particulier.</p>}
    <div className="form-grid"><label className="field field-wide"><span>Nom du projet *</span><input name="title" value={draft.title} onChange={change} required /></label><label className="field"><span>Catégorie</span><input name="category" value={draft.category} onChange={change} placeholder="Atelier, rencontre…" /></label><label className="field"><span>Organisateur *</span><input name="organizer" value={draft.organizer} onChange={change} required /></label><label className="field field-wide"><span>Adresse e-mail</span><input type="email" name="email" value={draft.email} onChange={change} /></label>
      <label className="field field-wide"><span>Nom du responsable</span><input name="referent" value={draft.referent} onChange={change} placeholder="Prénom et nom" aria-describedby="referent-hint" /></label>
      <label className="field field-wide"><span>Équipe / association du responsable</span><input name="referentTeam" value={draft.referentTeam} onChange={change} placeholder="Équipe ou association de rattachement" aria-describedby="referent-hint" /></label>
      <p id="referent-hint" className="field-full">Ces deux informations sont obligatoires pour confirmer l’événement.</p>
      <label className="field"><span>Date *</span><input type="date" name="date" value={draft.date} onChange={change} required /></label><label className="field"><span>Début *</span><input type="time" name="start" value={draft.start} onChange={change} required /></label><label className="field"><span>Fin *</span><input type="time" name="end" value={draft.end} onChange={change} required /></label><label className="field"><span>Espace *</span><select name="space" value={draft.space} onChange={change}>{bookableSpaces.map(space => <option key={space.id} value={space.id}>{space.name}{space.capacity != null ? ` · ${space.capacity} pers.` : ''}</option>)}</select></label>
      <label className="field"><span>Participants *</span><input type="number" min="1" name="participants" value={draft.participants} onChange={change} required /></label><label className="field"><span>Recettes prévues (€)</span><input type="number" min="0" name="revenue" value={draft.revenue} onChange={change} /></label><label className="field"><span>Coûts prévus (€)</span><input type="number" min="0" name="costs" value={draft.costs} onChange={change} /></label>
      <label className="field field-full"><span>Description de la demande</span><textarea name="description" rows="4" value={draft.description} onChange={change} /></label><label className="field field-full"><span>Opportunité pour les résidentes</span><textarea name="opportunity" rows="3" value={draft.opportunity} onChange={change} placeholder="Participation volontaire, transmission, rencontre…" /></label></div>
    <div className="form-actions"><button type="button" className="button button-quiet" onClick={onCancel}>Annuler</button><button className="button button-dark">Enregistrer la demande</button></div>
  </form>;
}
