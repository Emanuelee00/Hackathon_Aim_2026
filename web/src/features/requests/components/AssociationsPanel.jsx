import { useState } from 'react';

const taskStatuses = { todo: 'À faire', doing: 'En cours', done: 'Terminé' };

export default function AssociationsPanel({ event, onSave }) {
  const [association, setAssociation] = useState('');
  const [role, setRole] = useState('');
  const [title, setTitle] = useState('');
  const [assignee, setAssignee] = useState('');
  const partners = event.partners || [];
  const tasks = event.partnerTasks || [];
  const addPartner = e => {
    e.preventDefault();
    if (!association.trim() || !role.trim()) return;
    onSave({ ...event, partners: [...partners, { id: crypto.randomUUID(), name: association.trim(), role: role.trim() }] });
    setAssociation(''); setRole('');
  };
  const addTask = e => {
    e.preventDefault();
    if (!title.trim() || !partners.some(partner => partner.id === assignee)) return;
    onSave({ ...event, partnerTasks: [...tasks, { id: crypto.randomUUID(), title: title.trim(), assignee, status: 'todo' }] });
    setTitle('');
  };
  return <section className="detail-copy"><h3>Associations et tâches partagées</h3><p>Organisateur principal : {event.organizer}. Ajoutez les associations impliquées et leur rôle.</p>
    <ul>{partners.map(partner => <li key={partner.id}><strong>{partner.name}</strong> — {partner.role}</li>)}</ul>
    <form onSubmit={addPartner}><div className="form-grid"><label className="field"><span>Association partenaire</span><input required value={association} onChange={e => setAssociation(e.target.value)} /></label><label className="field"><span>Rôle dans l’événement</span><input required value={role} onChange={e => setRole(e.target.value)} /></label></div><button className="button button-quiet">Ajouter l’association</button></form>
    <p>{tasks.filter(task => task.status === 'done').length} / {tasks.length} tâches terminées</p>
    {tasks.map(task => <div className="form-grid" key={task.id}><label className="field"><span>{task.title} · {partners.find(partner => partner.id === task.assignee)?.name}</span><select aria-label={`Avancement : ${task.title}`} value={task.status} onChange={e => onSave({ ...event, partnerTasks: tasks.map(item => item.id === task.id ? { ...item, status: e.target.value } : item) })}>{Object.entries(taskStatuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label className="field"><span>Association chargée de « {task.title} »</span><select value={task.assignee} onChange={e => onSave({ ...event, partnerTasks: tasks.map(item => item.id === task.id ? { ...item, assignee: e.target.value } : item) })}>{partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label></div>)}
    {partners.length > 0 && <form onSubmit={addTask}><div className="form-grid"><label className="field"><span>Tâche à réaliser</span><input required value={title} onChange={e => setTitle(e.target.value)} /></label><label className="field"><span>Attribuer à l’association</span><select aria-label="Attribuer à l’association" required value={assignee} onChange={e => setAssignee(e.target.value)}><option value="">Choisir</option>{partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}</select></label></div><button className="button button-quiet">Ajouter la tâche</button></form>}
  </section>;
}
