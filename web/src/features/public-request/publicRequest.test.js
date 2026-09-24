import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequest, emptyForm, formErrors } from './publicRequest.js';
import { validateEvent } from '../../shared/lib/planning.js';

const form = { ...emptyForm, kind: 'privatisation', title: 'Anniversaire', space: 'chapelle', date: '2026-10-17', duration: 'half', start: '14:00', description: 'Une fête', organizer: 'Sam', email: 'sam@example.org' };

test('checks each field of the public form', () => {
  assert.deepEqual(Object.keys(formErrors(emptyForm, '2026-09-24')), ['title', 'space', 'date', 'description', 'organizer', 'email']);
  assert.deepEqual(formErrors(form, '2026-09-24'), {});
  assert.equal(formErrors({ ...form, date: '2026-09-01' }, '2026-09-24').date, 'Choisissez une date à venir.');
});

test('turns the form into a pending request the team can process', () => {
  const request = buildRequest(form, new Date('2026-09-24T10:00:00Z'));
  assert.equal(request.requestType, 'rental');
  assert.equal(request.privatisation, true);
  assert.equal(request.end, '18:00');
  assert.equal(request.revenue, 150);
  assert.equal(request.status, 'pending');
  assert.equal(validateEvent(request, []), '');
});

test('books coworking without choosing a room', () => {
  assert.equal(buildRequest({ ...form, kind: 'coworking', space: '' }).space, 'coworking');
  assert.equal(formErrors({ ...form, kind: 'coworking', space: '' }, '2026-09-24').space, undefined);
});
