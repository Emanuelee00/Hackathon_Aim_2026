import test from 'node:test';
import assert from 'node:assert/strict';
import { feedbackErrors, feedbackEvents } from './organizerFeedback.js';

test('asks for a rating, an attendance and the residents’ presence', () => {
  assert.deepEqual(Object.keys(feedbackErrors({ attendance: Number.NaN })), ['rating', 'attendance', 'residents']);
  assert.deepEqual(feedbackErrors({ rating: 4, attendance: 70, residents: 'yes' }), {});
});

test('offers feedback only for events already held', () => {
  const events = [{ id: 'a', status: 'confirmed', date: '2026-09-20' }, { id: 'b', status: 'confirmed', date: '2026-09-30' }, { id: 'c', status: 'pending', date: '2026-09-01' }];
  assert.deepEqual(feedbackEvents(events, '2026-09-24').map(event => event.id), ['a']);
});
