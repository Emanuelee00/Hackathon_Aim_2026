import test from 'node:test';
import assert from 'node:assert/strict';
import { occupancy, organizerSummary, responseDelay } from './impact.js';

test('measures occupancy from confirmed events and association slots', () => {
  const spaces = [{ id: 'salon' }, { id: 'reunion' }];
  const events = [{ space: 'salon', date: '2026-09-10', start: '09:00', end: '21:00', status: 'confirmed' }, { space: 'salon', date: '2026-09-11', start: '09:00', end: '21:00', status: 'pending' }];
  const [salon, reunion] = occupancy(spaces, events, [], '2026-09');
  assert.equal(salon.hours, 12);
  assert.equal(salon.rate, 3);
  assert.equal(reunion.rate, 0);
});

test('averages the response delay and the organisers’ ratings', () => {
  assert.equal(responseDelay([]), null);
  assert.equal(responseDelay([{ submittedAt: '2026-09-20T10:00:00Z', replySentAt: '2026-09-24T10:00:00Z' }]), 4);
  assert.deepEqual(organizerSummary([{ organizerFeedback: { rating: 5, residents: 'yes' } }, { organizerFeedback: { rating: 4, residents: 'no' } }, {}]), { count: 2, average: '4.5', withResidents: 1 });
});
