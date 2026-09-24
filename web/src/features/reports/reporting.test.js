import test from 'node:test';
import assert from 'node:assert/strict';
import { completedEvents, margin, reportableEvents } from './reporting.js';

const events = [
  { id: 'past', date: '2026-09-20', status: 'confirmed' },
  { id: 'today', date: '2026-09-24', status: 'confirmed' },
  { id: 'future', date: '2026-09-25', status: 'confirmed' },
  { id: 'done', date: '2026-09-19', status: 'completed', report: { revenue: 100, costs: 30 } },
];

test('offers reports only for confirmed events up to today', () => {
  assert.deepEqual(reportableEvents(events, '2026-09-24').map(event => event.id), ['past', 'today']);
});

test('keeps only completed events with a report', () => {
  assert.deepEqual(completedEvents(events).map(event => event.id), ['done']);
  assert.equal(margin(events[3].report), 70);
});
