import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import { defaultFollowupDate, followupDate, followupMonths, funderFields, fundingStatuses } from '../funding.js';

const shortFields = new Set(['name', 'type', 'contact', 'email', 'phone']);
// Name, type, contact, mail, phone and informations, above the tasks.
const IDENTITY = 6;

function TaskList({ tasks, onChange }) {
  const update = (id, patch) => onChange(tasks.map(task => task.id === id ? { ...task, ...patch } : task));
  return <fieldset className="funding-sheet-tasks"><legend>Tâches</legend>
    {tasks.map(task => <div key={task.id} className="funding-task-edit">
      <input type="checkbox" checked={task.done} aria-label={`Faite : ${task.text}`} onChange={event => update(task.id, { done: event.target.checked })} />
      <input aria-label="Tâche" placeholder="Que faut-il faire ?" value={task.text} onChange={event => update(task.id, { text: event.target.value })} />
      <input aria-label="Qui" placeholder="Qui ?" value={task.owner} onChange={event => update(task.id, { owner: event.target.value })} />
      <input type="date" aria-label="Pour quand" value={task.due} onChange={event => update(task.id, { due: event.target.value })} />
      <button type="button" className="icon-button" aria-label={`Supprimer la tâche ${task.text}`} onClick={() => onChange(tasks.filter(item => item.id !== task.id))}><Icon name="close" size={15} /></button>
    </div>)}
    <button type="button" className="text-link" onClick={() => onChange([...tasks, { id: crypto.randomUUID(), text: '', owner: '', due: '', done: false }])}><Icon name="plus" size={16} />Ajouter une tâche</button>
  </fieldset>;
}

// Edits a copy; closing the card (button, Escape or outside click) saves it.
export default function FunderSheet({ funder, onSave, onRemove, onClose }) {
  const [draft, setDraft] = useState(funder);
  const [removing, setRemoving] = useState(false);
  // Test d'envoi : un e-mail de rappel part tout de suite à l'équipe, pour vérifier que les e-mails arrivent.
  const [test, setTest] = useState({ busy: false, text: '', ok: false });
  const sendTest = async () => {
    setTest({ busy: true, text: '', ok: false });
    try {
      const response = await fetch('/api/funders/reminders/test', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) });
      const data = await response.json().catch(() => ({}));
      setTest(response.ok ? { busy: false, ok: true, text: `E-mail de test envoyé à ${data.to}.` } : { busy: false, ok: false, text: typeof data.detail === 'string' ? data.detail : 'L’envoi a échoué.' });
    } catch { setTest({ busy: false, ok: false, text: 'Le serveur est injoignable.' }); }
  };
  const set = (key, value) => setDraft(current => ({ ...current, [key]: value }));
  const close = () => { if (JSON.stringify(draft) !== JSON.stringify(funder)) onSave(draft); onClose(); };
  const remove = () => { onRemove(funder.id); onClose(); };
  const field = ([key, label]) => <label key={key} className={`field ${shortFields.has(key) ? '' : 'field-full'}`}><span>{label}</span>
    {shortFields.has(key) ? <input value={draft[key]} onChange={event => set(key, event.target.value)} /> : <textarea rows="3" value={draft[key]} onChange={event => set(key, event.target.value)} />}
  </label>;
  return <Modal title={draft.name || 'Nouvelle piste'} subtitle="FICHE FINANCEUR" onClose={close} className="modal-sheet">
    <div className="funding-sheet-top">
      <label className="field"><span>État</span><select value={draft.status} onChange={event => set('status', event.target.value)}>{Object.entries(fundingStatuses).map(([key, status]) => <option key={key} value={key}>{status.mark} {status.label}</option>)}</select></label>
      <label className="field"><span>Responsable</span><input value={draft.owner} placeholder="Véro, Caro…" onChange={event => set('owner', event.target.value)} /></label>
      <label className="field"><span>Date limite</span><input type="date" value={draft.deadline} onChange={event => set('deadline', event.target.value)} /></label>
      <label className="field"><span>Financement obtenu le</span><input type="date" value={draft.obtainedOn || ''} onChange={event => set('obtainedOn', event.target.value)} /></label>
      <label className="field"><span>Relance le (e-mail de rappel)</span><input type="date" value={followupDate(draft)} onChange={event => { if (event.target.value) set('followupOn', event.target.value); }} />
        <small className="funding-muted">{draft.followupOn ? <>Date choisie à la main. <button type="button" className="text-link" onClick={() => set('followupOn', '')}>Revenir à {followupMonths(draft)} mois après l’obtention</button></> : defaultFollowupDate(draft) ? `Par défaut : ${followupMonths(draft)} mois après l’obtention. Vous pouvez la changer.` : 'Renseignez la date d’obtention : la relance sera programmée 11 mois après (modifiable).'}</small></label>
    </div>
    <div className="funding-test-mail"><button type="button" className="button button-quiet button-small" disabled={test.busy} onClick={sendTest}>{test.busy ? 'Envoi…' : 'Envoyer un e-mail de test'}</button>
      {test.text && <span role="status" className={test.ok ? 'funding-test-ok' : 'funding-test-error'}>{test.text}</span>}</div>
    <div className="funding-sheet-grid">{funderFields.slice(0, IDENTITY).map(field)}</div>
    <TaskList tasks={draft.tasks} onChange={tasks => set('tasks', tasks)} />
    <div className="funding-sheet-grid">{funderFields.slice(IDENTITY).map(field)}</div>
    <div className="form-actions">{removing ? <><span className="funding-confirm-text">Supprimer définitivement cette piste ?</span><button type="button" className="button button-quiet" onClick={() => setRemoving(false)}>Garder</button><button type="button" className="button button-danger" onClick={remove}>Oui, supprimer</button></> : <button type="button" className="button button-danger" onClick={() => setRemoving(true)}>Supprimer la piste</button>}<button type="button" className="button button-dark" onClick={close}>Enregistrer et fermer</button></div>
  </Modal>;
}
