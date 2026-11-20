import test from 'node:test';
import assert from 'node:assert/strict';
import { committeeColumns, nextFriday } from './board.js';

test('finds the next committee day', () => {
  assert.equal(nextFriday('2026-09-24'), '2026-09-25');
  assert.equal(nextFriday('2026-09-25'), '2026-09-25');
  assert.equal(nextFriday('2026-09-26'), '2026-10-02');
});

test('groups open requests by verdict and keeps decisions apart', () => {
  const events = [
    { id: 'a', status: 'pending', date: '2026-10-02' },
    { id: 'b', status: 'waitlisted', date: '2026-10-01' },
    { id: 'c', status: 'confirmed', date: '2026-10-03', approval: { date: '2026-09-20' } },
    { id: 'd', status: 'confirmed', date: '2026-10-04' },
  ];
  const columns = committeeColumns(events, event => event.id === 'a' ? 'ok' : 'no');
  assert.deepEqual(columns.map(column => column.items.map(item => item.event.id)), [['a'], [], ['b'], ['c']]);
});
