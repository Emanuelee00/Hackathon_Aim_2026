import { useEffect, useState } from 'react';
import { moveColumn, resizeWithNeighbour, scaleWidths, totalWidth } from './tableMath.js';

const KEY = 'marthe-funding-table-v4';
// The table's columns: key, heading, starting share of the width (in pixels at 1212 px).
export const columns = [['name', 'Financeur', 200], ['type', 'Type', 100], ['amount', 'Montant', 140], ['deadline', 'Échéance', 160], ['obtained', 'Obtenu le', 160], ['followup', 'Relance le', 160], ['status', 'État', 150], ['owner', 'Resp.', 70], ['next', 'Prochaine action', 170], ['card', '', 110]];
const defaults = Object.fromEntries(columns.map(([key, , width]) => [key, width]));
const movable = columns.map(([key]) => key).filter(key => key !== 'card');
const MIN_TABLE = 480;
// A border dropped this close to its usual place snaps back in line with the other panels.
const SNAP = 16;
// The table's panel around it: padding and border, left and right.
export const PANEL_CHROME = 50;

function savedLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY)) || {};
    const order = saved.order?.length === movable.length && movable.every(key => saved.order.includes(key)) ? saved.order : movable;
    // Layouts saved before the delete button had the row actions at 88 px: room for two icons.
    const widths = saved.widths?.card === 88 ? { ...saved.widths, card: defaults.card } : saved.widths;
    return { ...saved, widths, order };
  } catch { return { order: movable }; }
}

// Widths, order and column colours chosen in this browser; until then the table fills the page's width.
export default function useTableLayout(slot) {
  const [layout, setLayout] = useState(savedLayout);
  const [available, setAvailable] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setAvailable(Math.floor(entry.contentRect.width)));
    observer.observe(slot.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(layout)); }
    catch { /* The layout remains for this visit. */ }
  }, [layout]);
  const widths = layout.widths || (available ? scaleWidths(defaults, available - PANEL_CHROME) : defaults);
  const change = patch => setLayout(current => ({ ...current, ...patch }));
  const drag = (event, resize) => {
    event.preventDefault();
    const startX = event.clientX;
    const move = moveEvent => resize(moveEvent.clientX - startX);
    const stop = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
  };
  // The neighbouring column gives or takes the difference: the table keeps its width.
  const resizeColumn = (key, width, from = widths) => change({ widths: resizeWithNeighbour(from, [...layout.order, 'card'], key, width) });
  const offset = layout.offset || 0;
  const near = (value, target) => Math.abs(value - target) <= SNAP;
  const resizeTable = (width, from = widths) => {
    const usual = available - PANEL_CHROME - offset;
    change({ widths: scaleWidths(from, Math.max(MIN_TABLE, near(width, usual) ? usual : width)) });
  };
  // The left border moves the panel's left side: its right side stays where it is.
  const resizeFromLeft = (width, minOffset = -Infinity, from = widths, fromOffset = offset) => {
    const right = fromOffset + totalWidth(from);
    const target = Math.max(MIN_TABLE, Math.min(width, right - minOffset));
    const next = scaleWidths(from, near(right - target, 0) ? right : target);
    change({ widths: next, offset: right - totalWidth(next) });
  };
  return {
    widths, chosen: Boolean(layout.widths), order: [...layout.order, 'card'], colors: layout.colors || {}, custom: Boolean(layout.widths) || layout.order.join() !== movable.join(),
    offset, resizeColumn, resizeTable, resizeFromLeft, reset: () => change({ widths: undefined, order: movable, offset: undefined }),
    startColumn: (key, event) => { const from = widths; drag(event, delta => resizeColumn(key, from[key] + delta, from)); },
    startTable: event => { const from = widths; drag(event, delta => resizeTable(totalWidth(from) + delta, from)); },
    startLeft: (event, minOffset) => { const [from, fromOffset] = [widths, offset]; drag(event, delta => resizeFromLeft(totalWidth(from) - delta, minOffset, from, fromOffset)); },
    move: (key, target) => change({ order: moveColumn(layout.order, key, target) }),
    sort: layout.sort || null,
    // Like a shop listing: ascending, then descending, then the table's own order.
    sortBy: key => change({ sort: layout.sort?.key !== key ? { key, direction: 'asc' } : layout.sort.direction === 'asc' ? { key, direction: 'desc' } : null }),
    colorColumn: (key, color) => change({ colors: { ...layout.colors, [key]: color } }),
  };
}
