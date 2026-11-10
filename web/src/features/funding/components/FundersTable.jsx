import { useRef, useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { closedStatuses, followupDate, followupMonths, fundingStatuses, nextTask, rowColors } from '../funding.js';
import { sortFunders } from '../sorting.js';
import { totalWidth } from '../tableMath.js';
import useTableLayout, { PANEL_CHROME, columns } from '../useTableLayout.js';
import { Edge, Heading, Popover, Swatches } from './TableMenus.jsx';

const filters = [['active', 'Actives'], ['all', 'Toutes'], ['closed', 'Hors course']];
const labels = Object.fromEntries(columns.map(([key, label]) => [key, label]));

// Saved when leaving the cell, like a spreadsheet. Text on several lines is edited
// in the full card, because a one-line field would drop its line breaks.
function Cell({ funder, field, label, type = 'text', onSave, onOpen }) {
  const value = funder[field] || '';
  if (value.includes('\n')) return <button type="button" className="funding-cell funding-cell-long" title={value} onClick={() => onOpen(funder.id)}>{value.split('\n')[0]}…</button>;
  const save = event => { if (event.target.value !== value) onSave({ ...funder, [field]: event.target.value }); };
  return <input key={value} type={type} className="funding-cell" title={value} aria-label={`${label} · ${funder.name}`} defaultValue={value} onBlur={save} onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }} />;
}

// The first open task, written in place: typing in an empty cell adds a task, emptying it removes the task.
function NextAction({ funder, today, onSave, onOpen }) {
  const task = nextTask(funder);
  const text = task?.text || '';
  const late = task?.due && task.due < today;
  if (text.includes('\n')) return <button type="button" className="funding-cell funding-cell-long" title={text} onClick={() => onOpen(funder.id)}>{text.split('\n')[0]}…</button>;
  const save = event => {
    const value = event.target.value.trim();
    if (value === text) return;
    const tasks = !task ? [...funder.tasks, { id: crypto.randomUUID(), text: value, owner: funder.owner, due: '', done: false }]
      : value ? funder.tasks.map(item => item.id === task.id ? { ...item, text: value } : item) : funder.tasks.filter(item => item.id !== task.id);
    onSave({ ...funder, tasks });
  };
  return <span className={`funding-next-cell ${late ? 'funding-late' : ''}`}>{late && <Icon name="clock" size={13} />}
    <input key={text} className="funding-cell" defaultValue={text} placeholder="Ajouter une action…" title={late ? `${text} · prévu le ${task.due}` : text} aria-label={`Prochaine action · ${funder.name}`} onBlur={save} onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }} />
  </span>;
}

// The delay before the reminder to ask the funder again (11 months unless changed), and the day it falls on.
function Followup({ funder, onSave }) {
  const months = followupMonths(funder);
  const when = followupDate(funder);
  const save = event => {
    const value = Number(event.target.value);
    if (Number.isInteger(value) && value > 0 && value <= 120) { if (value !== months) onSave({ ...funder, followupMonths: value }); } else event.target.value = months;
  };
  return <span className="funding-followup">
    <input key={months} type="number" min="1" max="120" className="funding-cell funding-cell-number" aria-label={`Relance en mois · ${funder.name}`} defaultValue={months} onBlur={save} onKeyDown={event => { if (event.key === 'Enter') event.target.blur(); }} />
    <small title="Un courriel de rappel part à l’équipe ce jour-là">{when ? `→ ${new Date(`${when}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'date d’obtention ?'}</small>
  </span>;
}

// Deleting a funder asks first, in red, next to the row.
function RemoveButton({ funder, onRemove }) {
  return <Popover label={`Supprimer la piste ${funder.name}`} icon="trash" up danger>{close => <div className="funding-remove">
    <p><b>Supprimer « {funder.name || 'piste sans nom'} » ?</b> La piste et ses tâches seront effacées.</p>
    <div><button type="button" className="button button-small funding-remove-yes" onClick={() => { close(); onRemove(funder); }}>Oui, supprimer</button><button type="button" className="button button-quiet button-small" onClick={close}>Annuler</button></div>
  </div>}</Popover>;
}

function Row({ funder, today, layout, onSave, onOpen, onRemove }) {
  const cell = (field, type) => <Cell funder={funder} field={field} label={labels[field === 'obtainedOn' ? 'obtained' : field] || 'Responsable'} type={type} onSave={onSave} onOpen={onOpen} />;
  const content = {
    name: cell('name'), type: cell('type'), amount: cell('amount'), deadline: cell('deadline', 'date'), obtained: cell('obtainedOn', 'date'), followup: <Followup funder={funder} onSave={onSave} />, owner: cell('owner'),
    status: <select className={`funding-status ${funder.status}`} aria-label={`État · ${funder.name}`} value={funder.status} onChange={event => onSave({ ...funder, status: event.target.value })}>{Object.entries(fundingStatuses).map(([key, status]) => <option key={key} value={key}>{status.mark} {status.label}</option>)}</select>,
    next: <NextAction funder={funder} today={today} onSave={onSave} onOpen={onOpen} />,
    card: <div className="funding-row-actions"><Popover label={`Couleur de la ligne ${funder.name}`} icon="palette" up>{close => <Swatches value={funder.color} onPick={color => { onSave({ ...funder, color }); close(); }} />}</Popover>
      <button type="button" className="icon-button" aria-label={`Ouvrir la fiche de ${funder.name}`} onClick={() => onOpen(funder.id)}><Icon name="file" size={16} /></button>
      <RemoveButton funder={funder} onRemove={onRemove} /></div>,
  };
  const classes = { card: 'funding-actions-cell', name: 'funding-name', deadline: funder.deadline && funder.deadline < today ? 'funding-past' : '', owner: 'funding-owner', next: 'funding-next' };
  // A row's colour wins over its column's, as when a whole line is highlighted in Excel.
  const background = column => rowColors[funder.color]?.value || rowColors[layout.colors[column]]?.value;
  return <tr>{layout.order.map(column => <td key={column} className={classes[column] || ''} style={{ background: background(column) }}>{content[column]}</td>)}</tr>;
}

export default function FundersTable({ funders, today, onSave, onOpen, onAdd, onRemove }) {
  const [filter, setFilter] = useState('active');
  const [query, setQuery] = useState('');
  const [dragging, setDragging] = useState(null);
  const [target, setTarget] = useState(null);
  const slot = useRef(null);
  const layout = useTableLayout(slot);
  const total = totalWidth(layout.widths);
  // How far left the panel may go: up to the page's content, never under the side menu.
  const leftLimit = () => (slot.current.closest('.app-content')?.getBoundingClientRect().left ?? 0) + 12 - slot.current.getBoundingClientRect().left;
  const drag = { dragging, target, setDragging, setTarget, end: () => { setDragging(null); setTarget(null); } };
  const search = query.trim().toLowerCase();
  const visible = sortFunders(funders.filter(funder => filter === 'all' || (filter === 'closed') === closedStatuses.includes(funder.status))
    .filter(funder => `${funder.name} ${funder.type} ${funder.notes}`.toLowerCase().includes(search)), layout.sort);
  // The panel follows the table: dragging its right border widens or narrows both.
  return <div className="funding-table-slot" ref={slot}><section className="panel funding-table-panel" style={{ width: layout.chosen ? total + PANEL_CHROME : undefined, minWidth: total + PANEL_CHROME, marginLeft: layout.offset }}>
    <div className="funding-tools"><h3>Toutes les pistes</h3>
      {filters.map(([key, label]) => <button key={key} type="button" className="chip" aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}
      <label className="funding-search"><Icon name="search" size={16} /><span className="sr-only">Rechercher</span><input type="search" placeholder="Rechercher un financeur…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    </div>
    <div className="funding-table-scroll"><table className="funding-table" style={{ width: total }}>
      <colgroup>{layout.order.map(key => <col key={key} style={{ width: layout.widths[key] }} />)}</colgroup>
      <thead><tr>{layout.order.map(key => <Heading key={key} column={key} label={labels[key]} layout={layout} drag={drag} />)}</tr></thead>
      <tbody>{visible.map(funder => <Row key={funder.id} funder={funder} today={today} layout={layout} onSave={onSave} onOpen={onOpen} onRemove={onRemove} />)}</tbody>
    </table></div>
    {!visible.length && <p className="funding-muted funding-none">Aucune piste ne correspond.</p>}
    <button type="button" className="text-link funding-add" onClick={onAdd}><Icon name="plus" size={16} />Ajouter une piste</button>
    <p className="funding-hint">Cliquez une cellule pour la modifier, comme dans Excel : la modification est enregistrée en quittant la cellule. Glissez un titre pour déplacer sa colonne, son bord pour changer sa largeur, les bords gauche et droit du cadre pour élargir ou rétrécir le tableau ; les flèches trient, « ⋯ » colore la colonne et la palette d’une ligne la colore. La disposition reste enregistrée.{layout.custom && <> <button type="button" className="text-link" onClick={layout.reset}>Largeurs et ordre par défaut</button></>}</p>
    <Edge label="Bord gauche du tableau" value={total} step={-40} className="funding-table-edge left" onDrag={event => layout.startLeft(event, leftLimit())} onResize={width => layout.resizeFromLeft(width, leftLimit())} onReset={layout.reset} />
    <Edge label="Bord droit du tableau" value={total} step={40} className="funding-table-edge" onDrag={layout.startTable} onResize={layout.resizeTable} onReset={layout.reset} />
  </section></div>;
}
