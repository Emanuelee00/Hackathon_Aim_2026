import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyProgress, journeyStage, journeyStats } from './tracking.js';

test('calculates progress from recorded outcomes', () => {
  const journey = { participation: 'participated', skills: 'Cuisine', contact: '', nextStep: 'training', followUp30: 'positive', followUp90: 'pending' };
  assert.equal(journeyProgress(journey), 75);
  assert.equal(journeyStage(journey), 'Suivi à 30 jours réalisé');
});

test('counts only resident-approved matches', () => {
  const matches = [{ status: 'proposed' }, { status: 'accepted', journey: { participation: 'participated', nextStep: 'job', followUp30: 'positive' } }];
  assert.deepEqual(journeyStats(matches), { active: 1, participated: 1, nextSteps: 1, followed: 1 });
});
