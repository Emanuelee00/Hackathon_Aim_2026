import { useState } from 'react';
import Icon from '../../../shared/components/Icon.jsx';
import { rowColors } from '../funding.js';
import { sortableColumns } from '../sorting.js';

export function Swatches({ value, onPick }) {
  return <div className="funding-swatches" role="group" aria-label="Couleur">
    {Object.entries(rowColors).map(([key, color]) => <button key={key} type="button" className="funding-swatch" style={{ background: color.value }} aria-label={color.label} aria-pressed={value === key} onClick={() => onPick(key)} />)}
    <button type="button" className="funding-swatch funding-swatch-none" aria-label="Sans couleur" aria-pressed={!value} onClick={() => onPick('')}><Icon name="close" size={12} /></button>
  </div>;
}

// A small menu next to a heading or a row; it closes on Escape or when focus leaves it.
export function Popover({ label, icon, up = false, danger = false, children }) {
  const [open, setOpen] = useState(false);
  return <span className="funding-popover" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}>
    <button type="button" className={`funding-menu-button ${danger ? 'danger' : ''}`} aria-label={label} title={label} aria-expanded={open} onClick={() => setOpen(current => !current)}><Icon name={icon} size={15} /></button>
    {open && <div className={`funding-popover-panel ${up ? 'up' : ''}`}>{children(() => setOpen(false))}</div>}
  </span>;
}

// Colour and position of a column, also reachable without dragging.
export function ColumnMenu({ column, label, layout }) {
  const index = layout.order.indexOf(column);
  const [before, after] = [layout.order[index - 1], layout.order[index + 1]];
  return <Popover label={`Options de la colonne ${label}`} icon="more">{close => <>
    <p className="funding-popover-title">Couleur de la colonne</p>
    <Swatches value={layout.colors[column]} onPick={color => { layout.colorColumn(column, color); close(); }} />
    <div className="funding-popover-moves">
      <button type="button" className="text-link" disabled={!before} onClick={() => layout.move(column, before)}><Icon name="left" size={14} />Déplacer à gauche</button>
      <button type="button" className="text-link" disabled={!after || after === 'card'} onClick={() => layout.move(column, after)}>Déplacer à droite<Icon name="right" size={14} /></button>
    </div>
  </>}</Popover>;
}

// A draggable edge (a column's or the table's); arrow keys move it, double-click resets it.
export function Edge({ label, value, className, step, onDrag, onResize, onReset }) {
  const keys = { ArrowLeft: -step, ArrowRight: step };
  return <span role="separator" aria-orientation="vertical" aria-label={label} aria-valuenow={value} tabIndex={0} className={className} title={`${label} : glisser pour changer · double-clic pour revenir`}
    onPointerDown={onDrag} onDoubleClick={onReset} onKeyDown={event => { if (keys[event.key]) { event.preventDefault(); onResize(value + keys[event.key]); } }} />;
}

// A heading: drag its title onto another to move the column, sort with the arrows.
export function Heading({ column, label, layout, drag }) {
  const sorted = layout.sort?.key === column ? layout.sort.direction : null;
  const canDrop = drag.dragging && drag.dragging !== column && column !== 'card';
  const next = { asc: 'décroissant', desc: 'sans tri' }[sorted] || 'croissant';
  return <th aria-sort={sorted ? `${sorted}ending` : undefined} className={drag.target === column ? 'funding-drop' : ''} style={{ background: rowColors[layout.colors[column]]?.value }}
    onDragOver={event => { if (canDrop) { event.preventDefault(); drag.setTarget(column); } }} onDrop={event => { event.preventDefault(); if (canDrop) layout.move(drag.dragging, column); drag.end(); }}>
    {label ? <div className="funding-th">
      <span className="funding-th-label" draggable title="Glisser pour déplacer la colonne" onDragStart={event => { event.dataTransfer.setData('text/plain', column); event.dataTransfer.effectAllowed = 'move'; drag.setDragging(column); }} onDragEnd={drag.end}>{label}</span>
      {sortableColumns.includes(column) && <button type="button" className={`funding-sort ${sorted ? 'on' : ''}`} aria-label={`Trier par ${label} : ${next}`} title={`Trier : ${next}`} onClick={() => layout.sortBy(column)}>{{ asc: '▲', desc: '▼' }[sorted] || '↕'}</button>}
      <ColumnMenu column={column} label={label} layout={layout} />
    </div> : <span className="sr-only">Actions</span>}
    {label && <Edge label={`Largeur de la colonne ${label}`} value={layout.widths[column]} step={10} className="funding-resize" onDrag={event => layout.startColumn(column, event)} onResize={width => layout.resizeColumn(column, width)} onReset={layout.reset} />}
  </th>;
}
