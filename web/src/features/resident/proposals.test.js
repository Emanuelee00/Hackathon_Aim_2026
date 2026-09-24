import test from 'node:test';
import assert from 'node:assert/strict';
import { cvMatches, groupProposals } from './proposals.js';

const available = [{ id: 'cuisine', description: 'Déjeuner', opportunity: 'Recette' }, { id: 'yoga', description: 'Yoga', opportunity: 'Places' }, { id: 'photo', description: 'Photo', opportunity: 'Portraits' }];

test('groups team, CV and open proposals without duplicates', () => {
  const mine = [
    { id: 'cuisine-marie', eventId: 'cuisine', status: 'proposed' },
    { id: 'photo-marie', eventId: 'photo', status: 'proposed', source: 'cv' },
  ];
  const groups = groupProposals(mine, available, 'marie');
  assert.deepEqual(groups.fromTeam.map(item => item.id), ['cuisine-marie']);
  assert.deepEqual(groups.fromCv.map(item => item.id), ['photo-marie']);
  assert.deepEqual(groups.open.map(item => item.id), ['yoga-marie']);
});

test('decided events leave the open list', () => {
  const mine = [{ id: 'yoga-marie', eventId: 'yoga', status: 'declined', source: 'open' }];
  assert.deepEqual(groupProposals(mine, available, 'marie').open.map(item => item.eventId), ['cuisine', 'photo']);
});

test('turns API proposals into CV matches', () => {
  assert.deepEqual(cvMatches([{ event_id: 'photo', reasons: ['photo'], rationale: 'r', benefit: 'b', vigilance: 'v' }]), [{ eventId: 'photo', source: 'cv', status: 'proposed', reasons: [{ kind: 'cv', text: 'photo' }], rationale: 'r', benefit: 'b', vigilance: 'v' }]);
});

test('applications wait apart from new proposals', () => {
  const mine = [{ id: 'yoga-marie', eventId: 'yoga', status: 'applied', source: 'open' }, { id: 'photo-marie', eventId: 'photo', status: 'not_selected', source: 'cv' }];
  const groups = groupProposals(mine, available, 'marie');
  assert.deepEqual(groups.applications.map(item => item.id), ['yoga-marie', 'photo-marie']);
  assert.deepEqual(groups.open.map(item => item.eventId), ['cuisine']);
});

test('internal team suggestions do not hide open activities', () => {
  const mine = [{ id: 'yoga-marie', eventId: 'yoga', status: 'suggested' }];
  assert.ok(groupProposals(mine, available, 'marie').open.some(item => item.eventId === 'yoga'));
});
