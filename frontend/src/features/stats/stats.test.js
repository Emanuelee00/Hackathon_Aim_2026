import test from 'node:test';
import assert from 'node:assert/strict';
import { breakdown, communityStats, eventStats, requestStats, satisfactionStats } from './stats.js';

test('counts labels, largest first, with their share', () => {
  assert.deepEqual(breakdown([{ s: 'Instagram' }, { s: 'E-mail' }, { s: 'Instagram' }, { s: 'Instagram' }], item => item.s), [{ label: 'Instagram', count: 3, share: 75 }, { label: 'E-mail', count: 1, share: 25 }]);
});

test('measures requests without the events Chez Marthe programs itself', () => {
  const stats = requestStats([{ organizer: 'A', status: 'pending' }, { organizer: 'B', status: 'confirmed' }, { organizer: 'C', status: 'cancelled' }, { organizer: 'D', status: 'completed' }, { organizer: 'Chez Marthe', status: 'confirmed' }]);
  assert.equal(stats.received, 4);
  assert.equal(stats.waiting, 1);
  assert.equal(stats.acceptance, 67);
  assert.equal(requestStats([]).acceptance, null);
});

test('sums attendance and money from reports, and splits upcoming from past events', () => {
  const stats = eventStats([
    { status: 'completed', date: '2026-09-19', participants: 20, revenue: 100, report: { attendance: 15, residents: 5, revenue: 90, costs: 30 } },
    { status: 'confirmed', date: '2026-10-01', participants: 10, revenue: 60, report: null },
    { status: 'pending', date: '2026-10-02', participants: 10, revenue: 500, report: null },
  ], '2026-09-24');
  assert.deepEqual([stats.total, stats.upcoming, stats.past, stats.reported], [2, 1, 1, 1]);
  assert.deepEqual([stats.attendance, stats.fillRate, stats.revenue, stats.costs, stats.expectedRevenue], [15, 75, 90, 30, 60]);
});

test('counts ratings of 4 or 5 as satisfied, from surveys and organisers', () => {
  const stats = satisfactionStats([{ satisfactionResponses: [{ satisfaction: 5, welcome: 5, usefulness: 4 }, { satisfaction: 2, welcome: 3, usefulness: 3 }], organizerFeedback: { rating: 4, logistics: 'ready' } }]);
  assert.equal(stats.ratings, 3);
  assert.equal(stats.satisfiedRate, 67);
  assert.equal(stats.logisticsReady, 100);
  assert.equal(stats.distribution.find(row => row.label === '5 / 5').count, 1);
  assert.equal(satisfactionStats([]).satisfiedRate, null);
});

test('measures residents’ participation, journeys and volunteer coverage', () => {
  const events = [
    { status: 'completed', report: { attendance: 20, residents: 5 } },
    { status: 'confirmed', volunteerNeeds: [{ id: 'a', needed: 4 }], volunteers: [{ needId: 'a' }] },
  ];
  const matches = [{ status: 'accepted', journey: { participation: 'participated', nextStep: 'training' } }, { status: 'dismissed' }];
  const stats = communityStats(events, matches);
  assert.deepEqual([stats.residents, stats.residentShare, stats.withResidents, stats.accepted, stats.participated, stats.nextSteps], [5, 25, 1, 1, 1, 1]);
  assert.deepEqual([stats.places, stats.filled, stats.coverage], [4, 1, 25]);
});
