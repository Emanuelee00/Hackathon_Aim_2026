import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import Modal from '../../../shared/components/Modal.jsx';
import { funderFields, fundingStatuses } from '../funding.js';

const shortFields = new Set(['name', 'type', 'contact', 'email', 'phone']);

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
    </div>
    <TaskList tasks={draft.tasks} onChange={tasks => set('tasks', tasks)} />
    <div className="funding-sheet-grid">{funderFields.map(field)}</div>
    <div className="form-actions">{removing ? <><span className="funding-confirm-text">Supprimer définitivement cette piste ?</span><button type="button" className="button button-quiet" onClick={() => setRemoving(false)}>Garder</button><button type="button" className="button button-danger" onClick={remove}>Oui, supprimer</button></> : <button type="button" className="button button-danger" onClick={() => setRemoving(true)}>Supprimer la piste</button>}<button type="button" className="button button-dark" onClick={close}>Enregistrer et fermer</button></div>
  </Modal>;
}
