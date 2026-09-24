import { useState } from 'react';
import { priorities, queueStatuses, queueUpdate } from '../queue.js';
import { statuses } from '../../../shared/data/spaces.js';

export default function QueuePanel({ event, onSave }) {
  const [status, setStatus] = useState(event.status);
  const [priority, setPriority] = useState(event.priority || 'normal');
  const [reason, setReason] = useState(event.queueReason || '');
  const [message, setMessage] = useState('');
  const submit = e => {
    e.preventDefault();
    try { onSave(queueUpdate(event, status, priority, reason)); setMessage('Suivi de la demande enregistré.'); }
    catch (error) { setMessage(error.message); }
  };
  return <section className="detail-copy"><h3>Priorité et suivi de la demande</h3>
    <p>Évaluez la cohérence avec la mission, l’urgence de la date, les disponibilités et l’ancienneté. La priorité est une décision de l’équipe, sans acceptation automatique.</p>
    <form onSubmit={submit}><div className="form-grid"><label className="field"><span>État de traitement</span><select aria-label="État de traitement" value={status} onChange={e => setStatus(e.target.value)}>{queueStatuses.map(value => <option key={value} value={value}>{statuses[value]}</option>)}</select></label><label className="field"><span>Priorité</span><select aria-label="Priorité" value={priority} onChange={e => setPriority(e.target.value)}>{Object.entries(priorities).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="field field-full"><span>Critères de priorité, motif d’attente ou éléments manquants</span><textarea required value={reason} onChange={e => setReason(e.target.value)} /></label></div><button className="button button-quiet">Enregistrer le suivi</button>{message && <p role="status">{message}</p>}</form>
    {event.status !== 'pending' && <p>Remettez la demande « À étudier » une fois les éléments réunis ou un créneau disponible, puis suivez son approbation habituelle.</p>}
    {event.queueHistory?.length > 0 && <details><summary>Historique du traitement</summary>{event.queueHistory.map((item, index) => <p key={index}>{new Date(item.recordedAt).toLocaleString('fr-FR')} · {statuses[item.status]} · {priorities[item.priority]} — {item.reason}</p>)}</details>}
  </section>;
}
