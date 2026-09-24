import { useStore } from '../../app/store.jsx';
import Icon from '../../shared/components/Icon.jsx';
import { associations } from '../../shared/data/associations.js';
import { bookableSpaces } from '../../shared/data/spaces.js';
import { dateLabel } from '../../shared/lib/format.js';
import { entriesFor, slotsOn, weekDays } from './week.js';

const kinds = [['programming', 'Programmation'], ['rental', 'Location'], ['asso', 'Association hébergée'], ['pending', 'Demande à étudier'], ['conflict', 'Conflit à arbitrer']];

function Entry({ entry, onOpen }) {
  const label = <><span>{entry.start}</span><strong>{entry.title}</strong></>;
  const className = `week-entry ${entry.conflict ? 'conflict' : entry.kind}`;
  return entry.kind === 'asso' ? <div className={className}>{label}</div> : <button className={className} onClick={() => onOpen(entry.id)}>{label}</button>;
}

export default function WeekBySpace({ monday, onOpen }) {
  const { events, partners } = useStore();
  const synced = associations.filter(association => partners.some(partner => partner.id === association.id && partner.synced));
  const days = weekDays(monday);
  const slots = days.flatMap(day => slotsOn(synced, day));
  const rows = bookableSpaces.map(space => ({ space, cells: days.map(day => entriesFor(space.id, day, events, slots)) }));
  const empty = rows.filter(row => row.cells.every(cell => !cell.length)).map(row => row.space.name);
  return <>
    <div className="calendar-scroll"><div className="week-grid">
      <div className="week-head">Espace</div>{days.map(day => <div className="week-head" key={day}>{dateLabel(day, { weekday: 'short', day: 'numeric' })}</div>)}
      {rows.map(row => [<div className="week-space" key={row.space.id}>{row.space.name}</div>, ...row.cells.map((cell, index) => <div className="week-cell" key={`${row.space.id}-${index}`}>{cell.map(entry => <Entry key={entry.id} entry={entry} onOpen={onOpen} />)}</div>)])}
    </div></div>
    <footer className="calendar-legend">{kinds.map(([kind, label]) => <span key={kind}><i className={`week-mark ${kind}`} />{label}</span>)}</footer>
    {!synced.length && <p className="week-note"><Icon name="help" size={16} />Les créneaux des associations hébergées apparaissent ici une fois leur agenda synchronisé depuis l’espace partenaires.</p>}
    {empty.length > 0 && <p className="week-note"><Icon name="euro" size={16} />Sans aucune réservation cette semaine : {empty.join(', ')}. Une piste pour proposer des locations à la demi-journée.</p>}
  </>;
}
