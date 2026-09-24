import test from 'node:test';
import assert from 'node:assert/strict';
import { preAnalysis } from './preAnalysis.js';
import { draftReply } from './replies.js';
import { estimatePrice, requestAlerts } from '../../shared/lib/requestRules.js';

const base = { id: 'a', title: 'Yoga', requestType: 'rental', space: 'chapelle', date: '2026-10-06', start: '18:00', end: '19:00', participants: 12, technical: [], openToResidents: true, status: 'pending' };

test('estimates the price from the spaces sheet', () => {
  assert.equal(estimatePrice({ ...base, requestType: 'programming' }).label, 'Gratuit');
  assert.equal(estimatePrice({ ...base, duration: 'weekly' }).amount, 30);
  assert.equal(estimatePrice({ ...base, duration: 'day', privatisation: true }).amount, 300);
  assert.equal(estimatePrice({ ...base, space: 'salon-collectif', duration: '2h' }).amount, 80);
  assert.equal(estimatePrice({ ...base, space: 'reunion' }).label, 'Sur devis');
  assert.equal(estimatePrice({ ...base, space: 'coworking' }).label, 'Sur demande');
});

test('warns about projections in the chapel and the residents’ evenings', () => {
  assert.ok(requestAlerts({ ...base, technical: ['video'] }).some(alert => alert.level === 'no' && alert.topic === 'technical'));
  assert.ok(requestAlerts({ ...base, space: 'salon-collectif', end: '20:00' }).some(alert => alert.topic === 'residents'));
  assert.ok(requestAlerts({ ...base, participants: 120 }).some(alert => alert.topic === 'capacity'));
});

test('sorts requests into aligned, to discuss and out of charter', () => {
  assert.equal(preAnalysis(base, []).verdict, 'ok');
  assert.equal(preAnalysis({ ...base, technical: ['video'] }, []).verdict, 'warn');
  assert.equal(preAnalysis({ ...base, space: 'jardin', end: '23:00', privatisation: true }, []).verdict, 'no');
  const other = { ...base, id: 'b', title: 'Atelier', status: 'confirmed' };
  assert.equal(preAnalysis(base, [other]).criteria.at(-1).level, 'no');
});

test('drafts an answer that lists the points to discuss', () => {
  const analysis = preAnalysis({ ...base, technical: ['video'] }, []);
  assert.match(draftReply(base, analysis), /projections/);
});
