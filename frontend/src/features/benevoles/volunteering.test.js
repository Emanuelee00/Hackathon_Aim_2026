import test from 'node:test';
import assert from 'node:assert/strict';
import { commitments, missions, signedUp, toggleSignup } from './volunteering.js';

const event = { id: 'e', status: 'confirmed', date: '2026-10-03', start: '14:00', volunteerNeeds: [{ id: 'bar', role: 'Buvette', needed: 1 }], volunteers: [] };

test('lists upcoming events that need volunteers', () => {
  assert.deepEqual(missions([event, { ...event, id: 'old', date: '2026-09-01' }, { ...event, id: 'none', volunteerNeeds: [] }], '2026-09-24').map(item => item.id), ['e']);
});

test('signs up, refuses a full role and signs out', () => {
  const joined = toggleSignup(event, 'bar', 'Camille');
  assert.equal(signedUp(joined, 'bar').length, 1);
  assert.throws(() => toggleSignup(joined, 'bar', 'Sam'), /complet/);
  assert.equal(commitments([joined], 'camille').length, 1);
  assert.equal(signedUp(toggleSignup(joined, 'bar', 'Camille '), 'bar').length, 0);
});
