import test from 'node:test';
import assert from 'node:assert/strict';
import { satisfactionSummary, validateResponse } from './satisfaction.js';

test('summarizes real answers without counting missing or invalid scores', () => {
  assert.equal(satisfactionSummary().count, 0);
  assert.equal(satisfactionSummary().satisfaction, '—');
  const responses = [{ satisfaction: 5, welcome: 4, usefulness: 3 }, { satisfaction: 3, welcome: 2, usefulness: 5 }];
  assert.deepEqual(satisfactionSummary([...responses, { satisfaction: 0 }]), { count: 2, satisfaction: '4.0', welcome: '3.0', usefulness: '4.0' });
  assert.notEqual(validateResponse({ satisfaction: 6, welcome: 3, usefulness: 3 }), '');
});
