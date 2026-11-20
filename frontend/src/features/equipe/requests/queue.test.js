import test from 'node:test';
import assert from 'node:assert/strict';
import { compareRequests, queueUpdate } from './queue.js';
import { bookingsForDate } from '../spaces/availability.js';
import { eligibleEvents } from '../opportunities/matching.js';

test('queue transitions preserve reasons and clear previous approval before renewed review', () => {
  const event = { id: 'test', date: '2026-10-01', status: 'pending', approval: { authority: 'committee' }, reviewStage: 'committee', opportunity: 'Atelier' };
  assert.throws(() => queueUpdate(event, 'waitlisted', 'high', '  '));
  const waiting = queueUpdate(event, 'waitlisted', 'high', 'Mission prioritaire, créneau occupé');
  assert.equal(waiting.approval, null);
  assert.equal(waiting.queueHistory.length, 1);
  assert.equal(bookingsForDate([waiting], event.date).length, 0);
  assert.equal(eligibleEvents([waiting]).length, 0);
  const resumed = queueUpdate(waiting, 'pending', 'high', 'Créneau libéré');
  assert.equal(resumed.reviewStage, null);
  assert.equal(resumed.waitlistedAt, null);
  assert.equal(resumed.queueHistory.length, 2);
  assert.equal(waiting.status, 'waitlisted');
});

test('orders waiting requests by priority then waiting time', () => {
  const events = [{ id: 'later', priority: 'high', waitlistedAt: '2026-09-23', date: '2026-10-01' }, { id: 'normal', priority: 'normal', waitlistedAt: '2026-09-20', date: '2026-10-01' }, { id: 'older', priority: 'high', waitlistedAt: '2026-09-21', date: '2026-10-01' }];
  assert.deepEqual(events.sort(compareRequests).map(event => event.id), ['older', 'later', 'normal']);
});
