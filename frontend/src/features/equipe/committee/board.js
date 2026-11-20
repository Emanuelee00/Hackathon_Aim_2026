import { queueStatuses } from '../requests/queue.js';

export function nextFriday(today) {
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() + ((5 - date.getDay() + 7) % 7));
  return date.toLocaleDateString('en-CA');
}

// Open requests grouped by pre-analysis verdict, then the latest recorded decisions.
export function committeeColumns(events, verdictOf) {
  const open = events.filter(event => queueStatuses.includes(event.status)).map(event => ({ event, verdict: verdictOf(event) }));
  const decided = events.filter(event => event.approval?.date && ['confirmed', 'cancelled'].includes(event.status)).sort((a, b) => b.approval.date.localeCompare(a.approval.date)).slice(0, 6).map(event => ({ event, verdict: null }));
  const byVerdict = verdict => open.filter(item => item.verdict === verdict).sort((a, b) => a.event.date.localeCompare(b.event.date));
  return [
    { id: 'ok', label: 'Alignées', items: byVerdict('ok') },
    { id: 'warn', label: 'À discuter', items: byVerdict('warn') },
    { id: 'no', label: 'Hors charte', items: byVerdict('no') },
    { id: 'decided', label: 'Décidées', items: decided },
  ];
}
