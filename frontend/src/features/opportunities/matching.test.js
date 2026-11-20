import test from 'node:test';
import assert from 'node:assert/strict';
import { eligibleEvents, eligibleResidents, workflowCounts } from './matching.js';

test('excludes profiles without data-processing consent', () => {
  assert.deepEqual(eligibleResidents([{ id: 'yes', consent: true }, { id: 'no', consent: false }]).map(item => item.id), ['yes']);
});

test('keeps actionable events and counts human decisions', () => {
  const events = [{ id: 'future', date: '2026-09-25', status: 'confirmed', opportunity: 'Une place' }, { id: 'done', date: '2026-09-20', status: 'completed', opportunity: 'Une place' }, { id: 'empty', date: '2026-09-21', status: 'pending', opportunity: '' }];
  assert.deepEqual(eligibleEvents(events).map(event => event.id), ['future']);
  assert.equal(workflowCounts([{ status: 'proposed' }, { status: 'accepted' }]).accepted, 1);
});
