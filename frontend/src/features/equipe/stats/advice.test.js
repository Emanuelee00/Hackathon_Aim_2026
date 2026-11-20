import test from 'node:test';
import assert from 'node:assert/strict';
import { followUpAdvice, spaceAdvice } from './advice.js';

const row = (name, rate) => ({ space: { name }, rate });

test('flags busy, empty and quiet spaces', () => {
  const advice = spaceAdvice([row('Chapelle', 70), row('Réunion', 0), row('Salon', 5), row('Jardin', 30)]);
  assert.equal(advice.length, 3);
  assert.match(advice[0].title, /Chapelle/);
  assert.match(advice[0].text, /Réunion/);
  assert.match(advice[1].title, /Réunion/);
  assert.match(advice[2].title, /Salon/);
  assert.deepEqual(spaceAdvice([row('Jardin', 30)]), []);
});

test('suggests follow-up actions only when a figure calls for it', () => {
  const calm = { requests: { waiting: 0, acceptance: 80 }, events: { fillRate: 90 }, satisfaction: { ratings: 4, satisfiedRate: 90, logisticsReady: 100 }, community: { coverage: 100, residentShare: 30, places: 4, filled: 4 }, delay: 2, toReport: 0 };
  assert.deepEqual(followUpAdvice(calm), []);
  const advice = followUpAdvice({ ...calm, requests: { waiting: 3, acceptance: 80 }, toReport: 1 });
  assert.deepEqual(advice.map(item => item.title), ['3 demandes en attente de réponse', '1 bilan à saisir']);
});
