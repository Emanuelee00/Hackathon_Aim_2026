import test from 'node:test';
import assert from 'node:assert/strict';
import { entriesFor, mondayOf, slotConflicts, slotsOn, weekDays } from './week.js';

const association = { id: 'x', slots: [{ id: 's', title: 'Atelier', weekdays: [1], start: '10:00', end: '12:00', space: 'salon' }] };

test('builds the week from its Monday', () => {
  assert.equal(mondayOf('2026-09-24'), '2026-09-21');
  assert.deepEqual(weekDays('2026-09-21').slice(0, 2), ['2026-09-21', '2026-09-22']);
});

test('flags overlaps between events and association slots', () => {
  const events = [{ id: 'yoga', title: 'Yoga', space: 'salon', date: '2026-09-28', start: '11:00', end: '12:00', status: 'pending' }];
  const entries = entriesFor('salon', '2026-09-28', events, slotsOn([association], '2026-09-28'));
  assert.equal(entries.length, 2);
  assert.ok(entries.every(entry => entry.conflict));
  assert.equal(slotConflicts(association, events, '2026-09-24').length, 1);
});
