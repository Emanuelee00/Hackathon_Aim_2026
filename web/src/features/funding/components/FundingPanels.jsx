import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { shortDate } from '../../../shared/lib/format.js';
import { closedStatuses, fundingStatuses, nextTask } from '../funding.js';

export const Avatar = ({ name }) => name ? <span className={`funding-avatar ${name.startsWith('C') ? 'plum' : ''}`} title={name}>{name[0]}</span> : null;

function StatusBars({ funders }) {
  const counts = Object.keys(fundingStatuses).map(status => [status, funders.filter(funder => funder.status === status).length]);
  const largest = Math.max(1, ...counts.map(([, count]) => count));
  const bar = ([status, count]) => <div key={status} className={`funding-bar-row ${closedStatuses.includes(status) ? 'off' : ''}`}><span>{fundingStatuses[status].label}</span><span className="funding-bar"><i style={{ width: `${count / largest * 80}%` }} /><b>{count}</b></span></div>;
  return <section className="panel funding-panel"><h3>Où en sont les {funders.length} pistes</h3>
    {counts.filter(([status]) => !closedStatuses.includes(status)).map(bar)}
    <p className="small-label funding-off-label">HORS COURSE</p>
    {counts.filter(([status]) => closedStatuses.includes(status)).map(bar)}
  </section>;
}

// Ticking a task asks for a confirmation in the row before marking it done.
function OverdueTasks({ overdue, lastDone, onOpen, onDone, onUndo }) {
  const [confirming, setConfirming] = useState(null);
  return <section className="panel funding-panel"><h3>Tâches en retard <span className="count-label">{overdue.length}</span></h3>
    {!overdue.length && <p className="funding-muted">Aucune tâche en retard.</p>}
    <ul className="funding-tasks">{overdue.map(({ funder, task }) => <li key={task.id}>
      <input type="checkbox" checked={confirming === task.id} aria-label={`Marquer comme faite : ${task.text}`} onChange={() => setConfirming(confirming === task.id ? null : task.id)} />
      <button type="button" onClick={() => onOpen(funder.id)}><Avatar name={task.owner} /><span><span className="funding-clamp">{task.text} · <b>{funder.name}</b></span><small className="funding-late"><Icon name="clock" size={13} />prévu le {shortDate(task.due)}</small></span></button>
      {confirming === task.id && <div className="funding-confirm" role="group" aria-label="Confirmer"><span>Marquer cette tâche comme faite ?</span><button type="button" className="button button-dark button-small" onClick={() => { setConfirming(null); onDone(funder, task); }}>Oui, c’est fait</button><button type="button" className="button button-quiet button-small" onClick={() => setConfirming(null)}>Annuler</button></div>}
    </li>)}</ul>
    {lastDone && <p className="funding-undo" role="status"><Icon name="check" size={15} /><span>« {lastDone.text} » ({lastDone.name}) marquée comme faite.</span><button type="button" className="text-link" onClick={onUndo}>Annuler</button></p>}
  </section>;
}

function Priorities({ funders, onOpen }) {
  const priorities = funders.filter(funder => funder.status === 'priority');
  return <section className="panel funding-panel funding-priorities"><h3>Pistes prioritaires <span className="count-label">{priorities.length}</span></h3>
    <ul>{priorities.map(funder => <li key={funder.id}><button type="button" onClick={() => onOpen(funder.id)}><b>{funder.name}</b><small>{nextTask(funder)?.text || 'Aucune action prévue'}</small></button></li>)}</ul>
  </section>;
}

export default function FundingPanels({ funders, overdue, lastDone, onOpen, onDone, onUndo }) {
  return <div className="funding-panels"><StatusBars funders={funders} /><OverdueTasks overdue={overdue} lastDone={lastDone} onOpen={onOpen} onDone={onDone} onUndo={onUndo} /><Priorities funders={funders} onOpen={onOpen} /></div>;
}
