import test from 'node:test';
import assert from 'node:assert/strict';
import { conflicts, validateEvent, validateReport } from './planning.js';

const request = { id: 'new', title: 'Atelier', organizer: 'Association', date: '2026-10-01', start: '10:00', end: '12:00', space: 'atelier', participants: 12, revenue: 50, costs: 10 };

test('detects a confirmed booking on the same space and time', () => {
  const existing = { ...request, id: 'existing', status: 'confirmed', start: '11:00', end: '13:00' };
  assert.deepEqual(conflicts(request, [existing]), [existing]);
  assert.match(validateEvent(request, [existing], true), /déjà réservé/);
});

test('allows a pending booking and adjacent time slots', () => {
  const pending = { ...request, id: 'pending', status: 'pending' };
  const adjacent = { ...request, id: 'adjacent', status: 'confirmed', start: '12:00', end: '13:00' };
  assert.equal(validateEvent(request, [pending, adjacent], true), '');
});

test('blocks confirmation above the room capacity', () => {
  assert.match(validateEvent({ ...request, participants: 25 }, [], true), /capacité/);
});

test('validates resident attendance and required feedback', () => {
  const report = { attendance: 5, residents: 6, revenue: 100, costs: 20, feedback: 'Très bien.' };
  assert.match(validateReport(report), /dépasser le total/);
  assert.match(validateReport({ ...report, residents: 2, feedback: '' }), /retour/);
  assert.equal(validateReport({ ...report, residents: 2 }), '');
});
