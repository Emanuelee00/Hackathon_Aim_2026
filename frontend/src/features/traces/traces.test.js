import test from 'node:test';
import assert from 'node:assert/strict';
import { laughTrace, residentTraces, stageOf, volunteerTraces } from './traces.js';

const past = { id: 'p', status: 'completed', date: '2026-09-20', start: '14:00', end: '17:00', space: 'atelier', participants: 20, volunteerNeeds: [{ id: 'a', role: 'Accueil', needed: 2 }], volunteers: [{ needId: 'a', name: 'Camille' }] };
const future = { ...past, id: 'f', status: 'confirmed', date: '2026-10-03' };

test('a trace grows from seed to tree, with the next step', () => {
  assert.deepEqual(stageOf(1), { stage: 'Une graine semée', next: 3 });
  assert.deepEqual(stageOf(12), { stage: 'En fleur', next: 25 });
  assert.equal(stageOf(40).next, null);
});

test('volunteer traces count only past help, in the person’s name', () => {
  const traces = volunteerTraces([past, future, { ...past, id: 'x', status: 'cancelled' }], 'camille ', '2026-09-24');
  assert.deepEqual(traces.map(item => [item.id, item.count, item.label]), [['moments', 1, 'coup de main donné'], ['hours', 3, 'heures offertes'], ['faces', 20, 'visages croisés'], ['places', 1, 'recoin du lieu habité']]);
  assert.deepEqual(volunteerTraces([past], 'Sam', '2026-09-24'), []);
});

test('resident traces come from lived activities only', () => {
  const journey = { participation: 'participated', skills: 'Accueil', contact: '', nextStep: 'training' };
  const matches = [{ resident_id: 'marie', eventId: 'p', status: 'accepted', journey }, { resident_id: 'marie', eventId: 'p', status: 'accepted', journey: { ...journey, participation: 'pending' } }, { resident_id: 'sofia', eventId: 'p', status: 'accepted', journey }];
  assert.deepEqual(residentTraces(matches, { p: past }, 'marie').map(item => [item.id, item.count]), [['moments', 1], ['skills', 1], ['steps', 1], ['faces', 20]]);
});

test('laughs are counted like any other trace', () => {
  assert.deepEqual(laughTrace([{ id: 'a' }, { id: 'b' }, { id: 'c' }]), { id: 'laughs', count: 3, label: 'rires partagés', stage: 'Ça pousse', next: 5 });
});
