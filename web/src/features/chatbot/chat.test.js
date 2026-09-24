import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_TURNS, toHistory } from './chat.js';

test('history keeps only role and content', () => {
  assert.deepEqual(toHistory([{ role: 'assistant', content: 'Transmis', handoff: 3 }]), [{ role: 'assistant', content: 'Transmis' }]);
});

test('history sends the most recent turns only', () => {
  const messages = Array.from({ length: MAX_TURNS + 5 }, (_, index) => ({ role: 'user', content: String(index) }));
  const history = toHistory(messages);
  assert.equal(history.length, MAX_TURNS);
  assert.equal(history.at(-1).content, String(MAX_TURNS + 4));
});
