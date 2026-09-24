import test from 'node:test';
import assert from 'node:assert/strict';
import { availabilityFor, bookingsForDate } from './availability.js';

const events = [
  { id: 'confirmed', date: '2026-09-24', space: 'atelier', status: 'confirmed' },
  { id: 'pending', date: '2026-09-24', space: 'atelier', status: 'pending' },
  { id: 'cancelled', date: '2026-09-24', space: 'salon', status: 'cancelled' },
];

test('ignores cancelled events when building a daily schedule', () => {
  assert.deepEqual(bookingsForDate(events, '2026-09-24').map(event => event.id), ['confirmed', 'pending']);
});

test('separates confirmed bookings from pending requests', () => {
  const availability = availabilityFor('atelier', '2026-09-24', events);
  assert.deepEqual(availability.confirmed.map(event => event.id), ['confirmed']);
  assert.deepEqual(availability.pending.map(event => event.id), ['pending']);
});
