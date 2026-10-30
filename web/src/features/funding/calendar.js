import { closedStatuses } from './funding.js';

// From the current month to the same month next year (October 2026 to October 2027).
export const CALENDAR_MONTHS = 13;

export const monthStart = (today, offset) => {
  const [year, month] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return date.toISOString().slice(0, 10);
};

// The months of the strip, each with its label; the year shows on the first, the last and January.
export function calendarMonths(today, count = CALENDAR_MONTHS) {
  return Array.from({ length: count }, (_, index) => {
    const start = monthStart(today, index);
    const label = new Date(`${start}T12:00:00`).toLocaleDateString('fr-FR', { month: 'short' });
    return { start, label, year: index === 0 || index === count - 1 || start.endsWith('-01-01') ? start.slice(0, 4) : '' };
  });
}

// Deadlines and open tasks in the window, on rows that never overlap.
export function calendarEvents(funders, today, count = CALENDAR_MONTHS, gap = 0.3) {
  const start = monthStart(today, 0);
  const end = monthStart(today, count);
  const span = Date.parse(end) - Date.parse(start);
  const deadlines = funders.filter(funder => !closedStatuses.includes(funder.status) && funder.deadline >= today && funder.deadline < end)
    .map(funder => ({ id: `deadline-${funder.id}`, funderId: funder.id, date: funder.deadline, label: funder.name, kind: 'deadline' }));
  const tasks = funders.flatMap(funder => funder.tasks.filter(task => !task.done && task.due >= start && task.due < end)
    .map(task => ({ id: `task-${task.id}`, funderId: funder.id, date: task.due, label: `${task.owner ? `${task.owner} · ` : ''}${funder.name}`, kind: task.due < today ? 'late' : 'task' })));
  const rows = [];
  return [...deadlines, ...tasks].sort((a, b) => a.date.localeCompare(b.date)).map(event => {
    const position = (Date.parse(event.date) - Date.parse(start)) / span;
    const row = rows.findIndex(last => position - last >= gap);
    const lane = row === -1 ? rows.length : row;
    rows[lane] = position;
    return { ...event, position, lane };
  });
}
