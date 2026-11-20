import { useState } from 'react';
import { signedUp } from './volunteering.js';

// Team side: the roles volunteers can sign up for on the bénévoles space.
export default function VolunteerNeedsPanel({ event, onSave }) {
  const [role, setRole] = useState('');
  const [needed, setNeeded] = useState(2);
  const needs = event.volunteerNeeds || [];
  const add = e => {
    e.preventDefault();
    if (!role.trim() || needed < 1) return;
    onSave({ ...event, volunteerNeeds: [...needs, { id: crypto.randomUUID(), role: role.trim(), needed: Number(needed) }] });
    setRole('');
  };
  const remove = needId => onSave({ ...event, volunteerNeeds: needs.filter(need => need.id !== needId), volunteers: (event.volunteers || []).filter(volunteer => volunteer.needId !== needId) });
  return <section className="detail-copy"><h3>Bénévoles</h3>
    <p>Les rôles ajoutés ici sont proposés sur l’espace bénévoles.</p>
    <ul>{needs.map(need => <li key={need.id}><strong>{need.role}</strong> · {signedUp(event, need.id).length} / {need.needed}{signedUp(event, need.id).length > 0 && ` (${signedUp(event, need.id).map(volunteer => volunteer.name).join(', ')})`} <button className="text-link" onClick={() => remove(need.id)}>Retirer</button></li>)}</ul>
    <form onSubmit={add}><div className="form-grid"><label className="field field-wide"><span>Rôle</span><input value={role} onChange={e => setRole(e.target.value)} placeholder="Accueil, buvette, régie…" /></label><label className="field"><span>Personnes</span><input type="number" min="1" value={needed} onChange={e => setNeeded(e.target.value)} /></label></div><button className="button button-quiet">Ajouter le rôle</button></form>
  </section>;
}
