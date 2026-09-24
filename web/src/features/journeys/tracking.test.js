import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyProgress, journeyStage, journeyStats, residentContacts, residentSkills } from './tracking.js';

test('calculates progress from recorded outcomes', () => {
  const journey = { participation: 'participated', skills: 'Cuisine', contact: '', nextStep: 'training', followUp30: 'positive', followUp90: 'pending' };
  assert.equal(journeyProgress(journey), 75);
  assert.equal(journeyStage(journey), 'Suivi à 30 jours réalisé');
});

test('counts only resident-approved matches', () => {
  const matches = [{ status: 'proposed' }, { status: 'accepted', journey: { participation: 'participated', nextStep: 'job', followUp30: 'positive' } }];
  assert.deepEqual(journeyStats(matches), { active: 1, participated: 1, nextSteps: 1, followed: 1 });
});

test('collects skills and contacts only from the resident’s accepted matches', () => {
  const event = { id: 'cuisine', title: 'Les saveurs qui nous relient' };
  const eventById = { cuisine: event };
  const matches = [
    { resident_id: 'fatou', eventId: 'cuisine', status: 'accepted', journey: { skills: 'Cuisine collective', contact: 'La Tablée Solidaire' } },
    { resident_id: 'fatou', eventId: 'cuisine', status: 'proposed', journey: { skills: 'Ignoré', contact: 'Ignoré' } },
    { resident_id: 'amina', eventId: 'cuisine', status: 'accepted', journey: { skills: 'Pas pour Fatou', contact: 'Pas pour Fatou' } },
  ];
  assert.deepEqual(residentSkills(matches, eventById, 'fatou'), [{ skill: 'Cuisine collective', event }]);
  assert.deepEqual(residentContacts(matches, eventById, 'fatou'), [{ contact: 'La Tablée Solidaire', event }]);
});
